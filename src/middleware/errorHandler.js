const AppError = require('../utils/AppError');

const send = (res, status, code, message, details) =>
  res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });

exports.notFound = (req, res, next) =>
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) return send(res, err.status, err.code, err.message, err.details);

  // malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return send(res, 400, 'INVALID_REQUEST_BODY', 'Malformed JSON in request body');
  }

  // Postgres safety nets (should be caught earlier by validation / service)
  if (err.code === '23505') return send(res, 409, 'DUPLICATE_TRANSACTION', 'Duplicate reference_id for this account');
  if (err.code === '22P02') return send(res, 400, 'VALIDATION_ERROR', 'Invalid value in request');
  if (err.code === '23514') return send(res, 400, 'VALIDATION_ERROR', 'Request violates a data constraint');

  console.error(err);
  return send(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
};
