const express = require("express");
const projectRoutes = require("./routes/projectRoutes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());

app.use("/projects", projectRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;