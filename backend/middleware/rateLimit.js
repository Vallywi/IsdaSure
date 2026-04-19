const buckets = new Map();

function createRateLimiter({ windowMs = 60_000, max = 30 } = {}) {
  return (request, response, next) => {
    const key = `${request.ip}:${request.path}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      response.status(429).json({
        success: false,
        message: 'Too many requests. Please try again shortly.',
      });
      return;
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
};
