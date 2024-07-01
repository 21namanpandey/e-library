import { v2 as cloudinary } from "cloudinary";
import { config } from "./config";

(async function() {
cloudinary.config({
  cloud_name: config.clodinaryCloud,
  api_key: config.clodinaryApiKey,
  api_secret: config.clodinarySecret, 
});
})();

export default cloudinary;
