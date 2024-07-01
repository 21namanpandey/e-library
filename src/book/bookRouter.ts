import express from "express";
import { createBook } from "./bookController";
import multer from "multer";
import path from "node:path";

const bookRouter = express.Router();

// file store local -> then in cloudinary
const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10mb
});

// Routes
//  /api/books
bookRouter.post(
  "/",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

export default bookRouter;
