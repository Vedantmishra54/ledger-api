const express = require('express');
const accountRoutes = require('./routes/accountRoutes');
const transferRoutes = require('./routes/transferRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/accounts', accountRoutes);
app.use('/transfers', transferRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
