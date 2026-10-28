const router = require('express').Router();
const transfer = require('../controllers/transferController');

router.post('/', transfer.createTransfer);

module.exports = router;
