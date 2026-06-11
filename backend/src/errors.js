// ====================================================================
// STRONGHOLD SYSTEM CENTRALIZED ERROR MANAGEMENT MODULE (errors.js)
// ====================================================================

/**
 * Base StrongHold Exception class containing structural metadata
 * for stylized presentation layers.
 */
class StrongHoldError extends Error {
    constructor(code, message, statusCode = 500, detailedLog = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.detailedLog = detailedLog || message;
        Error.captureStackTrace(this, this.constructor);
    }

    // Formats payload data cleanly for transfer over HTTP API rails
    toResponseObject() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                log: this.detailedLog,
                timestamp: new Date().toISOString()
            }
        };
    }
}

// 1. Cryptographic and Script Constraints Mismatch
class CryptographicError extends StrongHoldError {
    constructor(message, detailedLog = null) {
        super('ERR_CRYPTOGRAPHIC_FAILURE', message, 400, detailedLog);
    }
}

// 2. Multi-signature Threshold Failures
class MultisigThresholdError extends StrongHoldError {
    constructor(currentSigs, requiredSigs, detailedLog = null) {
        super(
            'ERR_MULTISIG_THRESHOLD_FAIL', 
            Escrow signature threshold mismatch. Provided ${currentSigs} of ${requiredSigs} required keys., 
            403, 
            detailedLog || The programmatic spending path remains locked. Ensure clinical oracle validations or time-locks pass before attempting co-signing.
        );
    }
}

// 3. Database State Synchronization and Network Failures
class DatabaseError extends StrongHoldError {
    constructor(message, detailedLog = null) {
        super('ERR_DATABASE_STATE_MISMATCH', message, 500, detailedLog);
    }
}

// 4. External Oracle Validation Mismatches
class OracleVerificationError extends StrongHoldError {
    constructor(message, detailedLog = null) {
        super('ERR_UNAUTHORIZED_ORACLE', message, 403, detailedLog);
    }
}

// 5. Lightning Network Settlement Issues
class LightningPaymentError extends StrongHoldError {
    constructor(message, detailedLog = null) {
        super('ERR_PAYMENT_REQUIRED', message, 402, detailedLog);
    }
}

// Global Express error handler middleware mapping exceptions to stylized responses
const errorHandlerMiddleware = (err, req, res, next) => {
    console.error(\x1b[31m[StrongHold System Error] [${err.code || 'UNKNOWN_CODE'}]: ${err.message}\x1b[0m);
    if (err.detailedLog && err.detailedLog !== err.message) {
        console.error(\x1b[37mDetail Trace: ${err.detailedLog}\x1b[0m);
    }

    if (err instanceof StrongHoldError) {
        return res.status(err.statusCode).json(err.toResponseObject());
    }

    // Fallback block for unhandled native runtime exceptions
    const unhandledException = new StrongHoldError(
        'ERR_INTERNAL_SERVER_FATAL',
        'A critical, unhandled engine error occurred on the core router.',
        500,
        err.stack
    );
    return res.status(500).json(unhandledException.toResponseObject());
};

module.exports = {
    StrongHoldError,
    CryptographicError,
    MultisigThresholdError,
    DatabaseError,
    OracleVerificationError,
    LightningPaymentError,
    errorHandlerMiddleware
};
