const AppError = require('../utils/AppError');
const v = require('../utils/validators');
const ledgerService = require('../services/ledgerService');

// POST /transfers
exports.createTransfer = async (req, res, next) => {
  try {
    v.assertBody(req.body);
    const from_account_id = v.validateUuid(req.body.from_account_id, 'from_account_id');
    const to_account_id = v.validateUuid(req.body.to_account_id, 'to_account_id');
    if (from_account_id === to_account_id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Source and destination accounts must be different');
    }
    const result = await ledgerService.transfer({
      from_account_id,
      to_account_id,
      amount: v.validateAmount(req.body.amount),
      description: v.validateDescription(req.body.description) || undefined,
      reference_id: v.validateReferenceId(req.body.reference_id),
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};
