let warned = false;

function isProd() {
    return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function getJwtSecret() {
    const secret = String(process.env.JWT_SECRET || '').trim();
    if (secret) {
        if (isProd() && secret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters in production');
        }
        return secret;
    }

    if (isProd()) {
        throw new Error('Missing JWT_SECRET (required in production)');
    }

    if (!warned) {
        warned = true;
        console.warn('⚠️  JWT_SECRET is not set; using insecure dev secret (do not use in production)');
    }
    return 'dev_secret';
}

function getJwtVerifyOptions() {
    return { algorithms: ['HS256'] };
}

module.exports = { getJwtSecret, getJwtVerifyOptions, isProd };
