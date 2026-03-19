const express = require("express");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const pledgeRoutes = require("./routes/pledgeRoutes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/projects", pledgeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
