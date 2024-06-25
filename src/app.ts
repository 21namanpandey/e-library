import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

// Routes

// HTTP request
app.get("/", (req, res, next) => {
  res.json({
    message: "Welcome to elib apis",
  });
});

// Global error handler
app.use(globalErrorHandler);

export default app;
