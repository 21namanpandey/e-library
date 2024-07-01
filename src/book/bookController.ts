import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const files = req.files as { [filename: string]: Express.Multer.File[] };
  const coverImageFile = files.coverImage[0];
  const coverImageMimeType = coverImageFile.mimetype.split("/").at(-1);
  const fileName = coverImageFile.filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );

  const bookFile = files.file[0];
  const bookFileName = bookFile.filename;
  const bookFilePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    bookFileName
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // Delete temp files
    await deleteFile(filePath);
    await deleteFile(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (error) {
    console.error("Error in createBook:", error);

    // Clean up temp files on error
    await cleanupTempFiles([filePath, bookFilePath]);

    return next(createHttpError(500, "Error while uploading the files"));
  }
};

async function deleteFile(filePath: string) {
  try {
    await fs.promises.unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    throw error; // Rethrow the error to propagate it further
  }
}

async function cleanupTempFiles(filePaths: string[]) {
  await Promise.all(
    filePaths.map(async (filePath) => {
      if (filePath) {
        try {
          await deleteFile(filePath);
        } catch (cleanupError) {
          console.error(
            `Error while cleaning up file ${filePath}:`,
            cleanupError
          );
        }
      }
    })
  );
}

export { createBook };
