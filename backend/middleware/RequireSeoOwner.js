'use strict';

const User = require('../models/User');
const { applySeoPrivateResponsePolicy } = require('./SeoResponsePolicy');

const NOT_FOUND_RESPONSE = Object.freeze({ error: 'Not found' });
const FORBIDDEN_RESPONSE = Object.freeze({ error: 'Forbidden' });

function normalizeEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeUserId(value) {
    return value == null ? '' : String(value).trim().toLowerCase();
}

function isValidMongoUserId(value) {
    return /^[a-f0-9]{24}$/.test(value);
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSeoOwnerConfig() {
    const enabled = String(process.env.SEO_DASHBOARD_ENABLED || '').trim().toLowerCase() === 'true';
    const ownerUserId = normalizeUserId(process.env.SEO_OWNER_USER_ID);
    const ownerEmail = normalizeEmail(process.env.SEO_OWNER_EMAIL);

    return {
        enabled,
        ownerUserId,
        ownerEmail,
        available:
            enabled &&
            isValidMongoUserId(ownerUserId) &&
            isValidEmail(ownerEmail),
    };
}

function isConfiguredSeoOwnerUserId(userId) {
    const configuredOwnerUserId = normalizeUserId(process.env.SEO_OWNER_USER_ID);
    return (
        isValidMongoUserId(configuredOwnerUserId) &&
        normalizeUserId(userId) === configuredOwnerUserId
    );
}

async function requireSeoOwner(req, res, next) {
    // This middleware can intentionally terminate before the SEO router gets
    // a chance to apply its response policy (for example the disguised 404
    // used when the feature is disabled). Set the private/no-index contract at
    // the authorization boundary so every success and rejection is fail-closed.
    applySeoPrivateResponsePolicy(res);

    const config = getSeoOwnerConfig();
    if (!config.available) {
        return res.status(404).json(NOT_FOUND_RESPONSE);
    }

    const authenticatedUserId = normalizeUserId(req.auth?.userId);
    if (!isValidMongoUserId(authenticatedUserId)) {
        return res.status(403).json(FORBIDDEN_RESPONSE);
    }

    try {
        // Do not trust role or identity claims cached by the authentication layer for
        // this owner-only surface. Reload the complete authorization tuple on every
        // request so role, email verification, and identity changes apply immediately.
        const user = await User.findById(authenticatedUserId)
            .select('_id email emailVerifiedAt role')
            .lean();

        const authorized = Boolean(
            user &&
            authenticatedUserId === config.ownerUserId &&
            normalizeUserId(user._id) === config.ownerUserId &&
            normalizeEmail(user.email) === config.ownerEmail &&
            user.emailVerifiedAt &&
            user.role === 'admin'
        );

        if (!authorized) {
            return res.status(403).json(FORBIDDEN_RESPONSE);
        }

        req.seoOwner = {
            userId: config.ownerUserId,
            email: config.ownerEmail,
        };
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getSeoOwnerConfig,
    isConfiguredSeoOwnerUserId,
    requireSeoOwner,
};
