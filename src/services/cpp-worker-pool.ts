/**
 * Process Pool for C++ FFI Computations
 *
 * Uses child_process.fork() for TRUE process isolation (separate address spaces).
 * This prevents the "double free or corruption" issues that occur with worker_threads
 * because each child process has its own copy of the C++ library's global state.
 *
 * When a cancellation is requested, the child process is killed instantly with SIGKILL.
 */
import { fork, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import type { CancellationToken } from '../utils/cancellation.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface WorkerTask {
  id: string
  type: 'compute' | 'compute_custom'
  params: any[]
}

interface WorkerResponse {
  id: string
  success: boolean
  data?: {
    error_probability: number
    error_exponent: number
    optimal_rho: number
    mutual_information: number
    cutoff_rate: number
    critical_rate: number
  }
  error?: string
}

interface PendingTask {
  task: WorkerTask
  resolve: (result: any) => void
  reject: (error: Error) => void
  cancellationToken?: CancellationToken
  workerId?: number
  checkInterval?: ReturnType<typeof setInterval>
}

export class CPPWorkerPool extends EventEmitter {
  private workers: Map<number, ChildProcess> = new Map()
  private busyWorkers: Set<number> = new Set()
  private taskQueue: PendingTask[] = []
  private pendingTasks: Map<string, PendingTask> = new Map()
  private nextWorkerId = 0
  private poolSize: number
  private isShuttingDown = false
  private logger?: { info: (...args: any[]) => void; error: (...args: any[]) => void; warn: (...args: any[]) => void }

  constructor(poolSize?: number, logger?: any) {
    super()
    // Default pool size: CPU cores - 1 (leave one for main thread), minimum 1, maximum 16
    this.poolSize = Math.max(1, Math.min(poolSize ?? (os.cpus().length - 1), 16))
    this.logger = logger
    this.initializePool()
  }

  private initializePool(): void {
    this.logger?.info(`[ProcessPool] Initializing pool with ${this.poolSize} child processes`)
    for (let i = 0; i < this.poolSize; i++) {
      this.spawnWorker()
    }
  }

  private spawnWorker(): number {
    const workerId = this.nextWorkerId++

    // Worker path - use the process-based worker script
    const workerPath = path.join(__dirname, '../workers/cpp-process-worker.js')

    // Fork a new child process (TRUE process isolation)
    const child = fork(workerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      // execArgv: [] // Don't inherit tsx loader for the child
    })

    // Handle stdout/stderr from child (for debugging)
    child.stdout?.on('data', (data) => {
      // Suppress verbose C++ output in production
      const msg = data.toString().trim()
      if (msg && !msg.includes('DEBUG') && !msg.includes('INFO:')) {
        this.logger?.info(`[Process ${workerId}] ${msg}`)
      }
    })

    child.stderr?.on('data', (data) => {
      this.logger?.error(`[Process ${workerId}] stderr: ${data.toString().trim()}`)
    })

    child.on('message', (msg: WorkerResponse) => this.handleWorkerMessage(workerId, msg))
    child.on('error', (err: Error) => this.handleWorkerError(workerId, err))
    child.on('exit', (code: number | null, signal: string | null) => this.handleWorkerExit(workerId, code, signal))

    this.workers.set(workerId, child)
    this.logger?.info(`[ProcessPool] Spawned child process ${workerId} (PID: ${child.pid})`)
    return workerId
  }

  private handleWorkerMessage(workerId: number, msg: WorkerResponse): void {
    const pending = this.pendingTasks.get(msg.id)
    if (!pending) {
      // Task was already cancelled/removed
      return
    }

    // Clean up
    if (pending.checkInterval) {
      clearInterval(pending.checkInterval)
    }
    this.pendingTasks.delete(msg.id)
    this.busyWorkers.delete(workerId)

    if (msg.success && msg.data) {
      pending.resolve(msg.data)
    } else {
      pending.reject(new Error(msg.error || 'Unknown worker error'))
    }

    // Process next queued task
    this.processQueue()
  }

  private handleWorkerError(workerId: number, error: Error): void {
    this.logger?.error(`[ProcessPool] Process ${workerId} error:`, error.message)

    // Find and reject any pending task for this worker
    for (const [taskId, pending] of this.pendingTasks) {
      if (pending.workerId === workerId) {
        if (pending.checkInterval) {
          clearInterval(pending.checkInterval)
        }
        this.pendingTasks.delete(taskId)
        pending.reject(new Error(`Process error: ${error.message}`))
      }
    }

    this.replaceWorker(workerId)
  }

  private handleWorkerExit(workerId: number, code: number | null, signal: string | null): void {
    this.busyWorkers.delete(workerId)
    this.workers.delete(workerId)

    if (!this.isShuttingDown) {
      if (signal === 'SIGKILL') {
        this.logger?.info(`[ProcessPool] Process ${workerId} killed (cancelled), spawning replacement`)
      } else if (code !== 0) {
        this.logger?.warn(`[ProcessPool] Process ${workerId} exited with code ${code}, signal ${signal}, replacing...`)
      }
      this.spawnWorker()
      this.processQueue()
    }
  }

  private replaceWorker(workerId: number): void {
    const child = this.workers.get(workerId)
    if (child) {
      // Force kill if still running
      child.kill('SIGKILL')
    }
    this.workers.delete(workerId)
    this.busyWorkers.delete(workerId)

    if (!this.isShuttingDown) {
      this.spawnWorker()
      this.processQueue()
    }
  }

  /**
   * Execute a computation task with optional cancellation support.
   * If cancelled, the child process will be KILLED instantly with SIGKILL.
   */
  async execute(
    task: WorkerTask,
    cancellationToken?: CancellationToken
  ): Promise<any> {
    // Check cancellation before queueing
    if (cancellationToken?.isCancelled) {
      throw new Error('Task cancelled before execution')
    }

    return new Promise((resolve, reject) => {
      const pending: PendingTask = { task, resolve, reject, cancellationToken }
      this.pendingTasks.set(task.id, pending)
      this.taskQueue.push(pending)

      // Setup cancellation listener for HARD KILL
      if (cancellationToken) {
        const checkInterval = setInterval(() => {
          if (cancellationToken.isCancelled) {
            clearInterval(checkInterval)
            this.handleCancellation(pending)
          }
        }, 10) // Check every 10ms for responsive cancellation

        pending.checkInterval = checkInterval
      }

      this.processQueue()
    })
  }

  /**
   * Handle task cancellation - either remove from queue or KILL the child process
   */
  private handleCancellation(pending: PendingTask): void {
    const taskId = pending.task.id

    // Clean up the check interval
    if (pending.checkInterval) {
      clearInterval(pending.checkInterval)
      pending.checkInterval = undefined
    }

    // If task is still in queue, just remove it
    const queueIndex = this.taskQueue.indexOf(pending)
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1)
      this.pendingTasks.delete(taskId)
      pending.reject(new Error('Task cancelled before execution'))
      return
    }

    // If task is running in a child process, KILL the process
    if (pending.workerId !== undefined) {
      const child = this.workers.get(pending.workerId)
      if (child) {
        this.logger?.info(`[ProcessPool] KILLING process ${pending.workerId} (PID: ${child.pid}) for task ${taskId}`)

        // Remove from tracking before kill
        this.pendingTasks.delete(taskId)
        this.busyWorkers.delete(pending.workerId)
        this.workers.delete(pending.workerId)

        // INSTANT KILL - SIGKILL cannot be caught or ignored
        child.kill('SIGKILL')

        pending.reject(new Error('Computation terminated by cancellation'))
      }
    }
  }

  private processQueue(): void {
    if (this.isShuttingDown) return

    // Find available workers and assign tasks
    for (const [workerId, child] of this.workers) {
      if (!this.busyWorkers.has(workerId) && this.taskQueue.length > 0) {
        const pending = this.taskQueue.shift()!

        // Skip if already cancelled
        if (pending.cancellationToken?.isCancelled) {
          if (pending.checkInterval) {
            clearInterval(pending.checkInterval)
          }
          this.pendingTasks.delete(pending.task.id)
          pending.reject(new Error('Task cancelled'))
          continue
        }

        this.busyWorkers.add(workerId)
        pending.workerId = workerId

        // Send task to child process via IPC
        child.send(pending.task)

        this.logger?.info(`[ProcessPool] Dispatched task ${pending.task.id} to process ${workerId}`)
      }
    }
  }

  /**
   * Gracefully shutdown the process pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true
    this.logger?.info('[ProcessPool] Shutting down...')

    // Clear all check intervals and reject queued tasks
    for (const pending of this.taskQueue) {
      if (pending.checkInterval) {
        clearInterval(pending.checkInterval)
      }
      this.pendingTasks.delete(pending.task.id)
      pending.reject(new Error('Process pool shutting down'))
    }
    this.taskQueue = []

    // Also reject any in-progress tasks
    for (const [taskId, pending] of this.pendingTasks) {
      if (pending.checkInterval) {
        clearInterval(pending.checkInterval)
      }
      pending.reject(new Error('Process pool shutting down'))
    }
    this.pendingTasks.clear()

    // Kill all child processes
    const killPromises = Array.from(this.workers.entries()).map(([id, child]) => {
      return new Promise<void>((resolve) => {
        child.once('exit', () => resolve())
        child.kill('SIGTERM')
        // Force kill after 1 second if not exited
        setTimeout(() => {
          if (child.exitCode === null) {
            child.kill('SIGKILL')
          }
          resolve()
        }, 1000)
      })
    })

    await Promise.allSettled(killPromises)

    this.workers.clear()
    this.busyWorkers.clear()
    this.logger?.info('[ProcessPool] Shutdown complete')
  }

  /**
   * Get current pool statistics
   */
  getStats(): { total: number; busy: number; queued: number; available: number } {
    return {
      total: this.workers.size,
      busy: this.busyWorkers.size,
      queued: this.taskQueue.length,
      available: this.workers.size - this.busyWorkers.size
    }
  }
}

// Singleton instance
let workerPool: CPPWorkerPool | null = null

/**
 * Get or create the singleton process pool instance
 */
export function getWorkerPool(logger?: any): CPPWorkerPool {
  if (!workerPool) {
    const poolSize = Math.max(1, os.cpus().length - 1)
    workerPool = new CPPWorkerPool(poolSize, logger)
  }
  return workerPool
}

/**
 * Shutdown the process pool (call on server shutdown)
 */
export async function shutdownWorkerPool(): Promise<void> {
  if (workerPool) {
    await workerPool.shutdown()
    workerPool = null
  }
}

/**
 * Check if process pool is initialized
 */
export function isWorkerPoolInitialized(): boolean {
  return workerPool !== null
}
