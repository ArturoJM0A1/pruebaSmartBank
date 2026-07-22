/**
 * ============================================================================
 * SMARTBANK - EXPRESS API SERVER
 * ============================================================================
 * 
 * PURPOSE: Main entry point for the SmartBank mock API server.
 *   This file configures Express, loads middleware, mounts routes,
 *   and starts listening for requests.
 * 
 * WHY EXPRESS:
 *   - Most popular Node.js web framework (largest ecosystem)
 *   - Minimal, unopinionated (you choose your own patterns)
 *   - Great documentation and community support
 *   - Easy to learn, powerful when needed
 * 
 * EXPRESS ALTERNATIVES:
 *   - Fastify: 2-3x faster than Express, schema-based validation,
 *     logging built-in. Good for high-performance APIs.
 *     WHY NOT HERE: Larger learning curve, less community support.
 * 
 *   - Koa: Created by Express creators, modern async/await support,
 *     smaller core. Good for middleware-heavy apps.
 *     WHY NOT HERE: Smaller ecosystem, fewer examples available.
 * 
 *   - Hono: Ultra-fast, runs on any runtime (Node, Deno, Bun, Cloudflare).
 *     Good for edge computing and serverless.
 *     WHY NOT HERE: Newer, smaller ecosystem, less documentation.
 * 
 *   - NestJS: Full framework with TypeScript, dependency injection,
 *     modules. Good for large enterprise apps.
 *     WHY NOT HERE: Overkill for a mock API, requires TypeScript.
 * 
 * SERVER ARCHITECTURE:
 *   Request → CORS → Body Parser → Router → Route Handler → Response
 *              ↓
 *          Logger
 *              ↓
 *       Error Handler (if error occurs)
 * 
 * ============================================================================
 */

'use strict';

// ============================================================================
// DEPENDENCIES
// ============================================================================
// WHY these specific packages:
//   - express: Web framework (the core)
//   - cors: Cross-Origin Resource Sharing (allows frontend to call API)
//   - jsonwebtoken: JWT token generation/verification (authentication)
//   - (No other dependencies - keeps it simple and educational)
// ============================================================================
const express = require('express');
const cors = require('cors');
const path = require('path');

// ============================================================================
// INITIALIZE EXPRESS APP
// ============================================================================
// WHY express() creates a new app: Express uses a factory pattern.
//   Each app is independent (useful for testing, microservices).
// ============================================================================
const app = express();

// ============================================================================
// CONFIGURATION
// ============================================================================
// WHY use environment variables:
//   - Different values for dev/staging/production
//   - Secrets (API keys, database URLs) never in code
//   - Easy to change without modifying source code
// 
// DEFAULT VALUES: Provide sensible defaults for development
// ============================================================================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE STACK
// ============================================================================
// WHY this order matters:
//   1. CORS: Must be first (modifies headers before other middleware)
//   2. Body parsing: Before routes (routes need parsed body)
//   3. Logging: After body parsing (logs complete requests)
//   4. Routes: After all setup middleware
//   5. Error handler: LAST (catches errors from all above)
// ============================================================================

// ============================================================================
// 1. CORS MIDDLEWARE
// ============================================================================
// WHY CORS:
//   - Browser security blocks requests from different origins
//   - Frontend (localhost:5173) calling API (localhost:3000) = different origin
//   - CORS headers tell browser "it's okay to make this request"
// 
// DEVELOPMENT: Allow all origins (anyone can call the API)
// PRODUCTION: Whitelist specific origins (only your frontend)
// 
// ALTERNATIVES:
//   - Proxy server (Nginx) handles CORS in production
//   - Same-origin deployment (frontend served by API server)
// ============================================================================
app.use(cors({
  origin: '*',  // WHY '*': Development convenience. NEVER use in production.
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],  // WHY: Allow frontend to read custom headers
}));

// ============================================================================
// 2. BODY PARSING MIDDLEWARE
// ============================================================================
// WHY parse JSON:
//   - HTTP requests send raw strings
//   - We need JavaScript objects (req.body)
//   - express.json() parses "Content-Type: application/json"
// 
// WHY limit body size:
//   - Prevents denial-of-service attacks (huge payloads)
//   - 10MB is generous for a banking API (most requests are tiny)
// 
// ALTERNATIVES:
//   - express.urlencoded(): For form submissions (application/x-www-form-urlencoded)
//   - multer: For file uploads (multipart/form-data)
//   - body-parser: Was separate package, now built into Express
// ============================================================================
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// 3. REQUEST LOGGING MIDDLEWARE
// ============================================================================
// WHY log requests:
//   - Debugging: See what requests are being made
//   - Monitoring: Track API usage patterns
//   - Security: Detect suspicious activity
// 
// DEVELOPMENT LOGGING:
//   - Shows method, URL, status, response time
//   - Color-coded for readability
// 
// PRODUCTION LOGGING:
//   - Use structured logging (JSON format)
//   - Send to logging service (Sentry, DataDog, CloudWatch)
//   - Include request ID for tracing
// 
// ALTERNATIVES:
//   - morgan: Popular HTTP request logger middleware
//   - pino: Fast, structured logger
//   - winston: Full-featured logging library
// ============================================================================
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    
    // WHY intercept res.json: To log response status after handler completes
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      const duration = Date.now() - start;
      const status = res.statusCode;
      
      // Color-code by status
      const color = status >= 500 ? '\x1b[31m' : // Red
                   status >= 400 ? '\x1b[33m' :  // Yellow
                   status >= 300 ? '\x1b[36m' :  // Cyan
                   '\x1b[32m';                    // Green
      
      console.log(
        `${color}${req.method}\x1b[0m ` +
        `${req.originalUrl} ` +
        `${color}${status}\x1b[0m ` +
        `${duration}ms`
      );
      
      return originalJson(data);
    };
    
    next();
  });
}

// ============================================================================
// 4. STATIC FILES
// ============================================================================
// WHY serve static files:
//   - Frontend files (HTML, CSS, JS) can be served from the same server
//   - Simplifies development (one server for API + frontend)
//   - Production: Usually separate (CDN for frontend, API server for backend)
// 
// PATH: ../src serves the frontend source directory
// ============================================================================
app.use(express.static(path.join(__dirname, '..', 'src')));

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
// WHY health check:
//   - Load balancers need to know if server is alive
//   - Monitoring systems ping this endpoint
//   - Docker/Kubernetes use it for readiness/liveness probes
//   - Simple GET request that always returns 200
// 
// CONVENTION: /api/health or /health
//   Returns server status, uptime, and basic info
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'SmartBank API',
      version: '1.0.0',
      environment: NODE_ENV,
      uptime: Math.floor(process.uptime()), // Seconds since server started
      timestamp: new Date().toISOString(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    },
  });
});

// ============================================================================
// 5. API ROUTES
// ============================================================================
// WHY separate route files:
//   - Separation of concerns (each entity has its own file)
//   - Easier to maintain (edit one file, not a 1000-line server.js)
//   - Easier to test (import individual route modules)
//   - Collaborative development (different people edit different files)
// 
// MOUNTING:
//   Each router handles a specific URL prefix.
//   Example: authRouter handles /api/auth/*
// ============================================================================
const authRoutes = require('./routes/auth.routes');
const accountsRoutes = require('./routes/accounts.routes');
const cardsRoutes = require('./routes/cards.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const servicesRoutes = require('./routes/services.routes');
const beneficiariesRoutes = require('./routes/beneficiaries.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const usersRoutes = require('./routes/users.routes');
const searchRoutes = require('./routes/search.routes');

// ============================================================================
// MOUNT ROUTES
// ============================================================================
// WHY this structure:
//   /api/auth/*         → Authentication (login, register, etc.)
//   /api/accounts/*     → Bank accounts
//   /api/cards/*        → Debit/credit cards
//   /api/transactions/* → Financial transactions
//   /api/services/*     → Bill payments
//   /api/beneficiaries/* → Saved recipients
//   /api/notifications/* → User notifications
//   /api/users/*        → User profile and settings
//   /api/search/*       → Global search
// 
// CONVENTION: /api prefix for all API routes
//   - Distinguishes API routes from static file routes
//   - Allows versioning: /api/v1/*, /api/v2/*
//   - Common in REST API design
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/search', searchRoutes);

// ============================================================================
// 6. API INFO ENDPOINT
// ============================================================================
// WHY: Provides API documentation link and available endpoints
//   Useful for developers exploring the API
// ============================================================================
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'SmartBank API',
      version: '1.0.0',
      description: 'Mock API for SmartBank digital banking application',
      documentation: '/api/docs',
      endpoints: {
        auth: '/api/auth',
        accounts: '/api/accounts',
        cards: '/api/cards',
        transactions: '/api/transactions',
        services: '/api/services',
        beneficiaries: '/api/beneficiaries',
        notifications: '/api/notifications',
        users: '/api/users',
        search: '/api/search',
        health: '/api/health',
      },
      defaultUsers: {
        admin: { email: 'admin@smartbank.mx', password: 'admin123' },
        user: { email: 'juan.perez@email.com', password: 'password123' },
        premium: { email: 'maria.lopez@email.com', password: 'password123' },
      },
    },
  });
});

// ============================================================================
// 7. 404 HANDLER (Not Found)
// ============================================================================
// WHY after routes:
//   - If no route matched, this catches the request
//   - Must be AFTER all route definitions
//   - Returns a consistent 404 error format
// ============================================================================
const { notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);

// ============================================================================
// 8. GLOBAL ERROR HANDLER
// ============================================================================
// WHY last:
//   - Express error handlers MUST have 4 parameters (err, req, res, next)
//   - Must be AFTER all routes and middleware
//   - Catches any unhandled errors from above
//   - Returns consistent error format to client
// ============================================================================
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================
// WHY app.listen():
//   - Starts the HTTP server
//   - Binds to the specified port
//   - Begins accepting connections
// 
// CALLBACK:
//   - Runs after server starts successfully
//   - Logs server info for developer reference
// 
// ERROR HANDLING:
//   - EADDRINUSE: Port already in use (another server running)
//   - EACCES: Permission denied (port < 1024 requires root)
// ============================================================================
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('  SMARTBANK API SERVER');
  console.log('='.repeat(60));
  console.log(`  Status:    Running`);
  console.log(`  Port:      ${PORT}`);
  console.log(`  Environment: ${NODE_ENV}`);
  console.log(`  API:       http://localhost:${PORT}/api`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log(`  Frontend:  http://localhost:${PORT}/`);
  console.log('='.repeat(60));
  console.log('\n  Default Accounts:');
  console.log('  - Admin:   admin@smartbank.mx / admin123');
  console.log('  - User:    juan.perez@email.com / password123');
  console.log('  - Premium: maria.lopez@email.com / password123');
  console.log('\n' + '='.repeat(60) + '\n');
});

// ============================================================================
// PORT IN USE HANDLER
// ============================================================================
// WHY: Instead of crashing when port is in use, try the next available port.
//   This is common in development when multiple instances are running.
// ============================================================================
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`\n[SERVER] Port ${PORT} is already in use.`);
    const altPort = PORT + 1;
    console.log(`[SERVER] Trying port ${altPort}...\n`);
    app.listen(altPort, () => {
      console.log(`[SERVER] Running on http://localhost:${altPort}`);
      console.log(`[SERVER] API: http://localhost:${altPort}/api`);
      console.log(`[SERVER] Frontend: http://localhost:${altPort}/\n`);
    });
  } else {
    console.error('[SERVER] Error:', err);
    process.exit(1);
  }
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
// WHY graceful shutdown:
//   - Complete in-flight requests before stopping
//   - Close database connections (if using a real DB)
//   - Clean up resources (file handles, connections)
//   - Prevent data corruption from abrupt stops
// 
// SIGNALS:
//   - SIGTERM: Sent by process managers (PM2, Docker, Kubernetes)
//   - SIGINT: Sent by Ctrl+C in terminal
// ============================================================================
process.on('SIGTERM', () => {
  console.log('\n[SERVER] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[SERVER] Closed all connections.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[SERVER] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[SERVER] Closed all connections.');
    process.exit(0);
  });
});

// ============================================================================
// UNHANDLED REJECTION/EXCEPTION HANDLERS
// ============================================================================
// WHY: Catch unhandled errors that would crash the server
//   - Unhandled promise rejections (async errors not caught)
//   - Uncaught exceptions (synchronous errors not caught)
//   - Log the error and continue running (don't crash)
// 
// PRODUCTION: Send to error monitoring service (Sentry, Bugsnag)
// ============================================================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection:', reason);
  // In production: sendToErrorMonitoring(reason);
});

process.on('uncaughtException', (error) => {
  console.error('[SERVER] Uncaught Exception:', error);
  // In production: sendToErrorMonitoring(error);
  // Then exit (server is in undefined state)
  process.exit(1);
});

// ============================================================================
// MODULE EXPORTS
// ============================================================================
// WHY export app:
//   - Allows testing (supertest can import the app without starting server)
//   - Allows programmatic usage (embedding in other apps)
//   - Does NOT start the server (that happens when file is run directly)
// 
// USAGE:
//   const app = require('./server');  // Import without starting
//   const server = app.listen(3000); // Start in test
// ============================================================================
module.exports = app;
