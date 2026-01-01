import { z } from 'zod'

// Environment variable schema
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().min(1).max(65535).default(8000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_PATH: z.string().default('./data/epcalculator.db'),
  DATABASE_WAL_MODE: z.coerce.boolean().default(true),

  // Security
  ALLOWED_ORIGINS: z.string().transform(str => str.split(',')).default('http://localhost:3000,http://localhost:8000'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // Computation
  MAX_COMPUTATION_TIME: z.coerce.number().default(30000), // 30 seconds
  MAX_CONCURRENT_COMPUTATIONS: z.coerce.number().default(10),
  ENABLE_COMPUTATION_CACHE: z.coerce.boolean().default(true),
  CACHE_TTL: z.coerce.number().default(3600), // 1 hour

  // University settings
  UNIVERSITY_NAME: z.string().default('UPF'),
  MAX_USERS: z.coerce.number().default(50),
  ENABLE_USAGE_ANALYTICS: z.coerce.boolean().default(false),

  // WebAssembly
  WASM_MEMORY_LIMIT: z.coerce.number().default(128), // MB
  ENABLE_WASM_THREADS: z.coerce.boolean().default(false)
})

// Parse and validate environment variables
function parseConfig() {
  try {
    return configSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment configuration:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export const config = parseConfig()

// Type for configuration
export type Config = z.infer<typeof configSchema>

// Configuration validation
export function validateConfig(): boolean {
  try {
    configSchema.parse(process.env)
    return true
  } catch {
    return false
  }
}

// Development helpers
export const isDevelopment = config.NODE_ENV === 'development'
export const isProduction = config.NODE_ENV === 'production'
export const isTest = config.NODE_ENV === 'test'

// Logging configuration
export const loggerConfig = {
  level: config.LOG_LEVEL,
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined
}

// University-specific configuration
export const universityConfig = {
  name: config.UNIVERSITY_NAME,
  maxUsers: config.MAX_USERS,
  enableAnalytics: config.ENABLE_USAGE_ANALYTICS,
  branding: {
    primaryColor: '#C8102E', // UPF red
    secondaryColor: '#000000',
    logoUrl: 'https://www.upf.edu/favicon.ico'
  }
}

console.log('✅ Configuration loaded successfully')
console.log(`🏫 University: ${universityConfig.name}`)
console.log(`🚀 Environment: ${config.NODE_ENV}`)
console.log(`🔧 Port: ${config.PORT}`)
console.log(`📊 Max Users: ${universityConfig.maxUsers}`)