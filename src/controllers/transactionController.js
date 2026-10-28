const AppError = require('../utils/AppError');
const v = require('../utils/validators');
const accountModel = require('../models/accountModel');
const transactionModel = require('../models/transactionModel');
const ledgerService = require('../services/ledgerService');

// POST /accounts/:id/transactions
exports.addTransaction = async (req, res, next) => {
  try {
    const accountId = v.validateUuid(req.params.id);
    v.assertBody(req.body);
    const payload = {
      type: v.validateType(req.body.type),
      amount: v.validateAmount(req.body.amount),
      description: v.validateDescription(req.body.description),
      reference_id: v.validateReferenceId(req.body.reference_id),
    };
    const result = await ledgerService.addTransaction(accountId, payload);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// GET /accounts/:id/transactions?type=&page=&limit=
exports.listTransactions = async (req, res, next) => {
  try {
    const accountId = v.validateUuid(req.params.id);
    const { page, limit, type } = v.validatePagination(req.query);

    const account = await accountModel.findById(accountId);
    if (!account) throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');

    const { rows, total } = await transactionModel.listByAccount(accountId, { type, page, limit });
    res.json({
      success: true,
      data: rows,
      pagination: {
        current_page: page,
        page_size: limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
};

// PUT / PATCH / DELETE on a transaction -> always rejected
exports.immutable = (req, res, next) => {
  next(new AppError(405, 'TRANSACTION_IMMUTABLE', 'Transactions cannot be edited or deleted'));
};
