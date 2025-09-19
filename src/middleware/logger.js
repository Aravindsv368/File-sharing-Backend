const logger = require("../utils/logger");

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  logger.info("HTTP Request", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user ? req.user.id : null,
  });

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("HTTP Response", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user ? req.user.id : null,
    });

    if (res.statusCode >= 400) {
      logger.warn("HTTP Error Response", {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        userId: req.user ? req.user.id : null,
      });
    }
  });

  next();
};

module.exports = loggerMiddleware;
