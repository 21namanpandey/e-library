import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre, description } = req.body;
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
      description,
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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre, description } = req.body;
  const bookId = req.params.bookId;
  const files = req.files as { [filename: string]: Express.Multer.File[] };

  try {
    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // check access
    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(
        createHttpError(
          403,
          "Unauthorized access, you cannot update others' book"
        )
      );
    }

    // check if image field exists
    let completeCoverImage = "";
    if (files?.coverImage) {
      const coverImageFile = files.coverImage[0];
      const coverMimeType = files.coverImage[0].mimetype.split("/").at(-1);
      const coverImagePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        coverImageFile.filename
      );
      completeCoverImage = coverImageFile.filename;

      const uploadResult = await cloudinary.uploader.upload(coverImagePath, {
        filename_override: completeCoverImage,
        folder: "book-covers",
        format: coverMimeType,
      });

      completeCoverImage = uploadResult.secure_url;
      await deleteFile(coverImagePath);
    }

    // check if file field exists
    let completeFileName = "";
    if (files?.file) {
      const bookFile = files.file[0];
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFile.filename
      );
      completeFileName = bookFile.filename;

      const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        filename_override: completeFileName,
        folder: "book-pdfs",
        format: "pdf",
      });

      completeFileName = uploadResultPdf.secure_url;
      await deleteFile(bookFilePath);
    }

    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      {
        title,
        genre,
        description: description,
        coverImage: completeCoverImage || book.coverImage,
        file: completeFileName || book.file,
      },
      { new: true }
    );

    res.json({ updatedBook });
  } catch (error) {
    console.error("Error in updateBook:", error);
    return next(createHttpError(500, "Error while updating the book"));
  }
};

const listBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: add pagination
    const book = await bookModel.find().populate("author", "name");

    res.json({ book });
  } catch (error) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel
      .findOne({ _id: bookId })
      .populate("author", "name");
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    res.json({ book });
  } catch (error) {
    return next(createHttpError(500, "Error while getting a single book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    // Check access
    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(
        createHttpError(
          403,
          "Unauthorized access, you cannot delete others' book"
        )
      );
    }

    // Extract public IDs for Cloudinary
    const coverFileSplits = book.coverImage.split("/");
    const coverimagePublicId =
      coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

    const bookFileSplits = book.file.split("/");
    const bookFilePublicId =
      bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    // Delete files from Cloudinary
    await cloudinary.uploader.destroy(coverimagePublicId);
    await cloudinary.uploader.destroy(bookFilePublicId, {
      resource_type: "raw",
    });

    // Delete the book from the database
    await bookModel.deleteOne({ _id: bookId });

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error in deleteBook:", error);
    return next(createHttpError(500, "Error while deleting the book"));
  }
};

export { createBook, updateBook, listBook, getSingleBook, deleteBook };
