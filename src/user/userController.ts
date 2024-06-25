import { NextFunction, Request, Response } from "express";

const createuser = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "User Registered" });
};

export { createuser };
