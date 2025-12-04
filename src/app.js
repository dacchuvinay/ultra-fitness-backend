const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');

const app = express();

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Security middleware
app.use(helmet());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// CORS configuration
app.use(cors({
    origin: true, // Allow all origins (including file://)
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/member', require('./routes/member.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

module.exports = app;
