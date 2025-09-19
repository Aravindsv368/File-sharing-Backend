const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn("Validation errors:", {
      errors: errors.array(),
      body: req.body,
      ip: req.ip,
    });

    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};
