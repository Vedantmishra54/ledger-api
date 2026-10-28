const AppError = require('../utils/AppError');
const v = require('../utils/validators');
const accountModel = require('../models/accountModel');

// POST /accounts   (balance sent by client is ignored; always starts at 0)
exports.createAccount = async (req, res, next) => {
  try {
    v.assertBody(req.body);
    const name = v.validateName(req.body.name);
    const account = await accountModel.create(name);
    res.status(201).json({ success: true, data: account });
  } catch (err) { next(err); }
};

// GET /accounts/:id/balance
exports.getBalance = async (req, res, next) => {
  try {
    const id = v.validateUuid(req.params.id);
    const account = await accountModel.findById(id);
    if (!account) throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');
    res.json({ success: true, data: { account_id: account.id, balance: account.balance } });
  } catch (err) { next(err); }
};
