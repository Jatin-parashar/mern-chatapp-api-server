import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for heavy usage
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Slightly increased for legitimate retries
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Doubled for natural conversation flow
  message: 'Slow down! Too many messages sent.',
});
