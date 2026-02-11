import http from 'http';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseService } from './services/database.js';
import { ComputationService } from './services/computation.js';
import { registerRoutes } from './routes/index.js';
import { config, APP_VERSION } from './config/index.js';
import { registerApiKeyAuth } from './middleware/api-key-auth.js';
import { registerCircuitBreaker } from './middleware/circuit-breaker.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// =============================================================================
// Initialization state - shared between bootstrap server and Fastify
// =============================================================================
let servicesReady = false;
let fastifyHandler = null;
// =============================================================================
// Single HTTP server - handles requests from startup through full operation
// No handoff gap = no "connection reset by peer" errors
// =============================================================================
const server = http.createServer((req, res) => {
    // Once Fastify is ready, delegate ALL requests to it
    if (fastifyHandler) {
        fastifyHandler(req, res);
        return;
    }
    // Bootstrap mode: only handle health checks while Fastify initializes
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/health' || req.url === '/health/live') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: servicesReady ? 'healthy' : 'starting',
            version: APP_VERSION,
            uptime: process.uptime(),
            ready: servicesReady,
            phase: 'bootstrap'
        }));
    }
    else if (req.url === '/health/ready') {
        if (servicesReady) {
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'ready' }));
        }
        else {
            res.writeHead(503);
            res.end(JSON.stringify({ status: 'not ready', reason: 'Services initializing' }));
        }
    }
    else {
        // All other routes return 503 during startup
        res.writeHead(503);
        res.end(JSON.stringify({ error: 'Service starting', status: 'initializing' }));
    }
});
// Start server IMMEDIATELY - health probes will work from first millisecond
server.listen(config.PORT, config.HOST, () => {
    console.log(`✅ Server listening on ${config.HOST}:${config.PORT}`);
    console.log('⏳ Initializing application...');
    initializeApp();
});
// =============================================================================
// Fastify application - uses serverFactory to inject into existing server
// =============================================================================
const fastify = Fastify({
    logger: {
        level: config.LOG_LEVEL,
        transport: config.NODE_ENV === 'development' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        } : undefined
    },
    trustProxy: true,
    maxParamLength: 200,
    // Use existing server - no new port binding needed
    serverFactory: (handler) => {
        fastifyHandler = handler;
        return server;
    }
});
// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
    const { validation, validationContext } = error;
    if (validation) {
        return reply.status(400).send({
            error: 'Validation Error',
            message: `Invalid ${validationContext}: ${error.message}`,
            statusCode: 400
        });
    }
    fastify.log.error(error);
    if (error.statusCode === 429) {
        return reply.status(429).send({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded, please try again later',
            statusCode: 429
        });
    }
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
        error: statusCode === 500 ? 'Internal Server Error' : error.name,
        message: statusCode === 500 ? 'Something went wrong' : error.message,
        statusCode
    });
});
// =============================================================================
// Plugin registration
// =============================================================================
async function registerPlugins() {
    // Security
    await fastify.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", "blob:"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        }
    });
    // CORS
    await fastify.register(cors, {
        origin: config.NODE_ENV === 'development' ? true : config.ALLOWED_ORIGINS,
        credentials: true
    });
    // Rate limiting
    await fastify.register(rateLimit, {
        max: config.RATE_LIMIT_MAX,
        timeWindow: config.RATE_LIMIT_WINDOW,
        errorResponseBuilder: () => ({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded, please try again later',
            statusCode: 429
        })
    });
    // API Key Authentication
    await registerApiKeyAuth(fastify);
    // Circuit Breaker
    await registerCircuitBreaker(fastify);
    // API documentation - enabled in development OR when ENABLE_API_DOCS=true
    const enableDocs = config.NODE_ENV === 'development' || config.ENABLE_API_DOCS;
    if (enableDocs) {
        // Determine server URL for Swagger
        const serverUrl = config.PUBLIC_URL || `http://localhost:${config.PORT}`;
        const serverDescription = config.PUBLIC_URL ? 'Production server' : 'Development server';
        await fastify.register(swagger, {
            openapi: {
                openapi: '3.0.0',
                info: {
                    title: 'EPCalculator API',
                    description: 'Error Exponent Calculator - Transmission System Analysis Tool API',
                    version: APP_VERSION
                },
                servers: [
                    { url: serverUrl, description: serverDescription }
                ],
                tags: [
                    { name: 'computation', description: 'Computation endpoints' },
                    { name: 'session', description: 'Session and cancellation endpoints' },
                    { name: 'health', description: 'Health check endpoints' },
                    { name: 'analytics', description: 'Analytics and monitoring endpoints' }
                ]
            }
        });
        await fastify.register(swaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: true
            }
        });
        console.log(`📖 API docs enabled at ${serverUrl}/docs`);
    }
    // Static files - built frontend
    await fastify.register(staticFiles, {
        root: path.join(__dirname, '../public'),
        prefix: '/static/'
    });
    // Tutorial images
    await fastify.register(staticFiles, {
        root: path.join(__dirname, 'frontend/assets/tutorial-images'),
        prefix: '/tutorial-images/',
        decorateReply: false
    });
    // Serve SPA
    await fastify.register(staticFiles, {
        root: path.join(__dirname, '../public'),
        prefix: '/',
        decorateReply: false
    });
}
// =============================================================================
// Service initialization
// =============================================================================
async function initializeServices() {
    const dbService = DatabaseService.getInstance();
    await dbService.initialize();
    const computationService = ComputationService.getInstance();
    await computationService.initialize(fastify.log);
    fastify.decorate('db', dbService);
    fastify.decorate('computation', computationService);
}
// =============================================================================
// Health endpoints (Fastify versions - used after handoff)
// =============================================================================
fastify.get('/health', async () => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
        uptime: process.uptime(),
        ready: true
    };
});
fastify.get('/health/live', async () => {
    return { status: 'alive' };
});
fastify.get('/health/ready', async () => {
    return { status: 'ready' };
});
// =============================================================================
// Graceful shutdown
// =============================================================================
async function gracefulShutdown() {
    console.log('Received shutdown signal, closing server...');
    try {
        await fastify.close();
        const dbService = DatabaseService.getInstance();
        await dbService.close();
        console.log('Server closed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}
// =============================================================================
// Main initialization
// =============================================================================
async function initializeApp() {
    try {
        console.log('⏳ Registering plugins...');
        await registerPlugins();
        console.log('⏳ Initializing services...');
        await initializeServices();
        console.log('⏳ Registering routes...');
        await registerRoutes(fastify);
        // Mark services ready BEFORE fastify.ready() so health checks pass
        servicesReady = true;
        // Finalize Fastify routing - this sets fastifyHandler via serverFactory
        // After this, ALL requests go through Fastify (including health checks)
        await fastify.ready();
        fastify.log.info(`🚀 EPCalculator v${APP_VERSION} ready`);
        fastify.log.info('✅ All services initialized');
        if (config.NODE_ENV === 'development') {
            fastify.log.info(`📖 API documentation available at http://${config.HOST}:${config.PORT}/docs`);
        }
        // Graceful shutdown handlers
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
}
export { fastify };
