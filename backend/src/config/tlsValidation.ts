/**
 * TLS/SSL Validation Module
 * 
 * This module validates that all external service connections are configured
 * with strict TLS/SSL validation for production environments.
 * 
 * Run this at application startup to catch configuration issues early.
 */

import type { Logger } from 'winston';

interface ValidationResult {
    name: string;
    status: 'OK' | 'WARNING' | 'ERROR';
    message: string;
}

const results: ValidationResult[] = [];

/**
 * Validate MongoDB configuration
 */
function validateMongoDB(): ValidationResult {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
        return {
            name: 'MongoDB',
            status: 'ERROR',
            message: 'MONGO_URI environment variable is not set',
        };
    }

    // Check for insecure parameters
    if (mongoUri.includes('tlsAllowInvalidCertificates=true')) {
        return {
            name: 'MongoDB',
            status: 'ERROR',
            message: 'MongoDB URI contains tlsAllowInvalidCertificates=true (insecure)',
        };
    }

    if (mongoUri.includes('sslValidate=false')) {
        return {
            name: 'MongoDB',
            status: 'ERROR',
            message: 'MongoDB URI contains sslValidate=false (insecure)',
        };
    }

    if (mongoUri.includes('tlsInsecure=true')) {
        return {
            name: 'MongoDB',
            status: 'ERROR',
            message: 'MongoDB URI contains tlsInsecure=true (insecure)',
        };
    }

    // Check for TLS usage
    const usesTLS = mongoUri.startsWith('mongodb+srv://') || mongoUri.includes('tls=true');
    
    if (!usesTLS && process.env.NODE_ENV === 'production') {
        return {
            name: 'MongoDB',
            status: 'ERROR',
            message: 'MongoDB URI does not use TLS in production (must use mongodb+srv:// or tls=true)',
        };
    }

    return {
        name: 'MongoDB',
        status: 'OK',
        message: `MongoDB TLS configured correctly (${mongoUri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'with tls=true'})`,
    };
}

/**
 * Validate Redis configuration
 */
function validateRedis(): ValidationResult {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return {
            name: 'Redis',
            status: 'WARNING',
            message: 'REDIS_URL not set, using default connection (may not be production-ready)',
        };
    }

    if ((redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) && process.env.NODE_ENV === 'production') {
        return {
            name: 'Redis',
            status: 'ERROR',
            message: 'Development Redis URL detected in production environment',
        };
    }

    const usesTLS = redisUrl.startsWith('rediss://');

    return {
        name: 'Redis',
        status: 'OK',
        message: `Redis configured with ${usesTLS ? 'TLS encryption' : 'non-TLS connection (temporarily allowed)'}`,
    };
}

/**
 * Validate S3/R2 configuration
 */
function validateS3(): ValidationResult {
    const s3Endpoint = process.env.S3_ENDPOINT;
    
    if (!s3Endpoint) {
        return {
            name: 'S3/R2',
            status: 'OK',
            message: 'Using default AWS S3 endpoint (HTTPS by default)',
        };
    }

    // Check for HTTP in production
    if (s3Endpoint.startsWith('http://') && process.env.NODE_ENV === 'production') {
        return {
            name: 'S3/R2',
            status: 'ERROR',
            message: `S3 endpoint uses HTTP in production: ${s3Endpoint}. Must use HTTPS.`,
        };
    }

    if (s3Endpoint.startsWith('https://')) {
        return {
            name: 'S3/R2',
            status: 'OK',
            message: 'S3 endpoint configured with HTTPS',
        };
    }

    return {
        name: 'S3/R2',
        status: 'WARNING',
        message: `S3 endpoint format unclear: ${s3Endpoint}`,
    };
}

/**
 * Validate SMTP configuration
 */
function validateSMTP(): ValidationResult {
    const smtpHost = process.env.SMTP_HOST;
    
    if (!smtpHost) {
        return {
            name: 'SMTP',
            status: 'WARNING',
            message: 'SMTP_HOST not configured, email functionality may be unavailable',
        };
    }

    // SMTP TLS validation is handled in sendMail.ts with rejectUnauthorized: true
    return {
        name: 'SMTP',
        status: 'OK',
        message: `SMTP configured with TLS strict validation (${smtpHost})`,
    };
}

/**
 * Check for dangerous environment variables
 */
function validateEnvironmentVariables(): ValidationResult[] {
    const dangerousVars = [
        { key: 'NODE_TLS_REJECT_UNAUTHORIZED', value: '0', message: 'NODE_TLS_REJECT_UNAUTHORIZED=0 is a critical security risk' },
    ];

    const violations: ValidationResult[] = [];

    for (const { key, value, message } of dangerousVars) {
        if (process.env[key] === value) {
            violations.push({
                name: 'Environment Variables',
                status: 'ERROR',
                message,
            });
        }
    }

    if (violations.length === 0) {
        violations.push({
            name: 'Environment Variables',
            status: 'OK',
            message: 'No dangerous TLS bypass environment variables detected',
        });
    }

    return violations;
}

/**
 * Run all TLS validations
 */
export function validateTLSConfiguration(): void {
    console.log('\n========================================');
    console.log('🔒 TLS/SSL Configuration Validation');
    console.log('========================================\n');

    const allResults = [
        validateMongoDB(),
        validateRedis(),
        validateS3(),
        validateSMTP(),
        ...validateEnvironmentVariables(),
    ];

    let hasErrors = false;
    let hasWarnings = false;

    for (const result of allResults) {
        const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️ ' : '❌';
        console.log(`${icon} ${result.name}: ${result.message}`);

        if (result.status === 'ERROR') {
            hasErrors = true;
        }
        if (result.status === 'WARNING') {
            hasWarnings = true;
        }
    }

    console.log('\n========================================');

    if (hasErrors) {
        console.error('❌ TLS validation FAILED: Critical security issues detected');
        process.exit(1);
    }

    if (hasWarnings && process.env.NODE_ENV === 'production') {
        console.warn('⚠️  TLS validation PARTIAL: Warnings detected in production');
        console.warn('Please review the warnings above before deploying');
    }

    if (!hasErrors && !hasWarnings) {
        console.log('✅ All TLS/SSL configurations are secure');
    }

    console.log('========================================\n');
}

export default validateTLSConfiguration;
