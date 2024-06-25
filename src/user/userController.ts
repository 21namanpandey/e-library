import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModal from "./userModal";

const createuser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  // database call
  const user = await userModal.findOne({ email });

  if (user) {
    const error = createHttpError(400, "User already exist with this email");
    return next(error);
  }
  // processs
  // response
  res.json({ message: "User Registered" });
};

export { createuser };
