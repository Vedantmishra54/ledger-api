const router = require('express').Router();
const account = require('../controllers/accountController');
const tx = require('../controllers/transactionController');

router.post('/', account.createAccount);
router.get('/:id/balance', account.getBalance);

router.post('/:id/transactions', tx.addTransaction);
router.get('/:id/transactions', tx.listTransactions);
router.route('/:id/transactions/:txId').put(tx.immutable).patch(tx.immutable).delete(tx.immutable);

module.exports = router;
