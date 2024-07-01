import { config as conf } from "dotenv";

conf();

const _config = {
  port: process.env.PORT,
  databaseUrl: process.env.MONGO_URL,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  clodinaryCloud: process.env.CLOUDINARY_CLOUD,
  clodinaryApiKey: process.env.CLOUDINARY_API_KEY,
  clodinarySecret: process.env.CLOUDINARY_API_SECRET,
};

export const config = Object.freeze(_config);
