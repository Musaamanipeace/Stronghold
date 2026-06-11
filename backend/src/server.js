// server.js - StrongHold Backend API Server
const express = require('express');
const cors = require('cors');
const { errorHandlerMiddleware, StrongHoldError } = require('./errors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'StrongHold API online', timestamp: new Date().toISOString() });
});

/**
 * Endpoint 5: Mock User Authentication & Session Generation
 * POST /api/auth/session
 */
app.post('/api/auth/session', async (req, res, next) => {
    try {
        const { email, password, requestedRole } = req.body;

        if (!email || !password) {
            throw new StrongHoldError('ERR_AUTH_MISSING', 'Email and password credentials are required.', 400);
        }

        // Simulating basic credential evaluation paths against your database storage
        const mockUserId = "usr-" + Buffer.from(email).toString('hex').substring(0, 10);
        
        // Generate a mock JWT access token structured for routing authorization
        const mockAccessToken = `sh_token_${Buffer.from(JSON.stringify({ userId: mockUserId, role: requestedRole })).toString('base64')}`;

        return res.status(200).json({
            success: true,
            message: 'Session handshake authenticated successfully.',
            session: {
                userId: mockUserId,
                role: requestedRole,
                token: mockAccessToken,
                expiresInSeconds: 3600
            }
        });

    } catch (err) {
        next(err);
    }
});

// Error handling middleware
app.use(errorHandlerMiddleware);

// Server startup
app.listen(PORT, () => {
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Server running at http://localhost:${PORT}`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Health check: GET /api/health`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Authentication: POST /api/auth/session`);
});

module.exports = app;
