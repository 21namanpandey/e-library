import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

const createuser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }
  // processs
  // response
  res.json({ message: "User Registered" });
};

export { createuser };
