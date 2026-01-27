import { randomUUID } from 'crypto'

/**
 * Cancellation token for tracking and cancelling requests
 */
export interface CancellationToken {
  sessionId: string
  requestId: string
  isCancelled: boolean
  cancel: () => void
  throwIfCancelled: () => void
}

/**
 * Error thrown when a computation is cancelled
 */
export class CancellationError extends Error {
  public readonly code = 'REQUEST_CANCELLED'
  public readonly completedCount?: number
  public readonly totalCount?: number

  constructor(message: string, completedCount?: number, totalCount?: number) {
    super(message)
    this.name = 'CancellationError'
    this.completedCount = completedCount
    this.totalCount = totalCount
  }
}

// Active tokens indexed by session
const activeTokens = new Map<string, Set<CancellationToken>>()

/**
 * Create a new cancellation token for a request
 */
export function createCancellationToken(
  sessionId: string,
  requestId?: string
): CancellationToken {
  const token: CancellationToken = {
    sessionId,
    requestId: requestId ?? randomUUID(),
    isCancelled: false,
    cancel: () => {
      console.log(`[Cancellation] Token ${token.requestId} for session ${sessionId} CANCELLED`)
      token.isCancelled = true
    },
    throwIfCancelled: () => {
      if (token.isCancelled) {
        throw new CancellationError('Request cancelled by client')
      }
    }
  }

  // Register token for this session
  if (!activeTokens.has(sessionId)) {
    activeTokens.set(sessionId, new Set())
  }
  activeTokens.get(sessionId)!.add(token)

  console.log(`[Cancellation] Token ${token.requestId} REGISTERED for session ${sessionId} (total: ${activeTokens.get(sessionId)!.size})`)

  return token
}

/**
 * Cancel all active requests for a session
 * Returns the number of requests cancelled
 */
export function cancelAllForSession(sessionId: string): number {
  console.log(`[Cancellation] cancelAllForSession called for session: ${sessionId}`)
  console.log(`[Cancellation] Active sessions: ${Array.from(activeTokens.keys()).join(', ')}`)

  const tokens = activeTokens.get(sessionId)
  if (!tokens) {
    console.log(`[Cancellation] No tokens found for session ${sessionId}`)
    return 0
  }

  console.log(`[Cancellation] Found ${tokens.size} tokens for session ${sessionId}`)

  let cancelledCount = 0
  for (const token of tokens) {
    if (!token.isCancelled) {
      token.cancel()
      cancelledCount++
    }
  }

  console.log(`[Cancellation] Cancelled ${cancelledCount} tokens`)
  return cancelledCount
}

/**
 * Remove a token when request completes (success or failure)
 */
export function removeToken(token: CancellationToken): void {
  const tokens = activeTokens.get(token.sessionId)
  if (tokens) {
    tokens.delete(token)
    if (tokens.size === 0) {
      activeTokens.delete(token.sessionId)
    }
  }
}

/**
 * Get count of active requests for a session
 */
export function getActiveRequestCount(sessionId: string): number {
  const tokens = activeTokens.get(sessionId)
  return tokens ? tokens.size : 0
}

/**
 * Get all active session IDs (for monitoring)
 */
export function getActiveSessions(): string[] {
  return Array.from(activeTokens.keys())
}

/**
 * Get total active request count across all sessions
 */
export function getTotalActiveRequests(): number {
  let total = 0
  for (const tokens of activeTokens.values()) {
    total += tokens.size
  }
  return total
}
