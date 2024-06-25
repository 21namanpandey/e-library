import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";

const app = express();

// Routes

// HTTP request
app.get("/", (req, res, next) => {
  res.json({
    message: "Welcome to e-lib apis",
  });
});

app.use("/api/users", userRouter);

// Global error handler
app.use(globalErrorHandler);

export default app;
