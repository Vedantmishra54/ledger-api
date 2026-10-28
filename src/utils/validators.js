const AppError = require('./AppError');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AMOUNT = 1_000_000_000;

function assertBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'INVALID_REQUEST_BODY', 'Request body must be a valid JSON object');
  }
}

// returns lower-cased uuid so comparisons with DB values are safe
function validateUuid(value, field = 'account_id') {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new AppError(400, 'INVALID_ACCOUNT_ID', `${field} must be a valid UUID`);
  }
  return value.toLowerCase();
}

function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'name is required');
  }
  if (name.trim().length > 255) {
    throw new AppError(400, 'VALIDATION_ERROR', 'name must be at most 255 characters');
  }
  return name.trim();
}

function validateType(type) {
  if (type !== 'credit' && type !== 'debit') {
    throw new AppError(400, 'INVALID_TRANSACTION_TYPE', "type must be either 'credit' or 'debit'");
  }
  return type;
}

function validateAmount(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, 'INVALID_AMOUNT', 'amount must be a number greater than 0');
  }
  if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) {
    throw new AppError(400, 'INVALID_AMOUNT', 'amount can have at most 2 decimal places');
  }
  if (amount > MAX_AMOUNT) {
    throw new AppError(400, 'INVALID_AMOUNT', `amount cannot exceed ${MAX_AMOUNT}`);
  }
  return amount;
}

function validateReferenceId(ref) {
  if (typeof ref !== 'string' || !ref.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'reference_id is required');
  }
  if (ref.trim().length > 100) {
    throw new AppError(400, 'VALIDATION_ERROR', 'reference_id must be at most 100 characters');
  }
  return ref.trim();
}

function validateDescription(desc) {
  if (desc === undefined || desc === null) return null;
  if (typeof desc !== 'string' || desc.length > 500) {
    throw new AppError(400, 'VALIDATION_ERROR', 'description must be a string up to 500 characters');
  }
  return desc;
}

function validatePagination(query) {
  const { page = '1', limit = '10', type } = query;
  if (!/^\d+$/.test(String(page)) || Number(page) < 1) {
    throw new AppError(400, 'INVALID_PAGINATION', 'page must be a positive integer');
  }
  if (!/^\d+$/.test(String(limit)) || Number(limit) < 1 || Number(limit) > 100) {
    throw new AppError(400, 'INVALID_PAGINATION', 'limit must be an integer between 1 and 100');
  }
  if (type !== undefined && type !== 'credit' && type !== 'debit') {
    throw new AppError(400, 'INVALID_TRANSACTION_TYPE', "type filter must be 'credit' or 'debit'");
  }
  return { page: Number(page), limit: Number(limit), type };
}

module.exports = {
  assertBody, validateUuid, validateName, validateType, validateAmount,
  validateReferenceId, validateDescription, validatePagination,
};
