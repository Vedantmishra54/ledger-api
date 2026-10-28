const { withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const accountModel = require('../models/accountModel');
const transactionModel = require('../models/transactionModel');

/**
 * Applies ONE credit/debit. Must run inside a DB transaction
 * and the account row must already be locked (FOR UPDATE).
 */
async function applyTransaction(client, accountId, { type, amount, description, reference_id }) {
  const existing = await transactionModel.findByReference(client, accountId, reference_id);
  if (existing) {
    throw new AppError(409, 'DUPLICATE_TRANSACTION',
      'A transaction with this reference_id already exists for this account',
      { transaction: existing });
  }

  const delta = type === 'credit' ? amount : -amount;
  const ok = await accountModel.applyDelta(client, accountId, delta);
  if (!ok) throw new AppError(422, 'INSUFFICIENT_BALANCE', 'Insufficient balance for this debit');

  return transactionModel.insert(client, { account_id: accountId, type, amount, description, reference_id });
}

async function addTransaction(accountId, payload) {
  return withTransaction(async (client) => {
    const locked = await accountModel.lockByIds(client, [accountId]);
    if (!locked.length) throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');

    const transaction = await applyTransaction(client, accountId, payload);
    const account = await accountModel.findById(accountId, client);
    return { transaction, balance: account.balance };
  });
}

async function transfer({ from_account_id, to_account_id, amount, description, reference_id }) {
  return withTransaction(async (client) => {
    const locked = await accountModel.lockByIds(client, [from_account_id, to_account_id]);
    if (!locked.includes(from_account_id)) {
      throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Source account not found');
    }
    if (!locked.includes(to_account_id)) {
      throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Destination account not found');
    }

    // debit + credit in the SAME db transaction: both happen or neither does
    const debit = await applyTransaction(client, from_account_id, {
      type: 'debit', amount, reference_id,
      description: description || `Transfer to ${to_account_id}`,
    });
    const credit = await applyTransaction(client, to_account_id, {
      type: 'credit', amount, reference_id,
      description: description || `Transfer from ${from_account_id}`,
    });

    const from = await accountModel.findById(from_account_id, client);
    const to = await accountModel.findById(to_account_id, client);
    return {
      debit_transaction: debit,
      credit_transaction: credit,
      balances: { [from.id]: from.balance, [to.id]: to.balance },
    };
  });
}

module.exports = { addTransaction, transfer };
