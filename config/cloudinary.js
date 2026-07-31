import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// To upload an image or 4 images
export const upload = multer({ storage: multer.memoryStorage() });

// To upload an image to cloudinary
export const uploadToCloudinary = async (fileBuffer) => {
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "polling-app" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    );
    stream.end(fileBuffer);
  });
};

export default cloudinary;
