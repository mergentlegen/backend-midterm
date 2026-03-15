const express = require('express');
const app = express();

const pledgeRoutes = require('./routes/pledgeRoutes');

app.use(express.json());
app.use('/', pledgeRoutes);

module.exports = app;