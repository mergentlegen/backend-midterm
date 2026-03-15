const express = require('express');

const pledgeRoutes = require('./routes/pledgeRoutes');

const app = express();

app.use(express.json());
app.use('/', pledgeRoutes);

module.exports = app;