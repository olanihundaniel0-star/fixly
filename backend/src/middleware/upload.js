import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: () => process.env.CLOUDINARY_FOLDER || "fixly",
  },
});

const multerInstance = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!IMAGE_TYPES.includes(file.mimetype)) {
      const error = new Error("Only JPEG, PNG or WEBP images are allowed");
      error.statusCode = 400;
      return cb(error);
    }
    return cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

const upload = (handler) => (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      statusCode: 503,
      success: false,
      message: "File uploads are not configured",
    });
  }
  return handler(req, res, (error) => (error ? next(error) : next()));
};

export const uploadImage = (fieldName = "image") =>
  upload(multerInstance.single(fieldName));

export const uploadImages = (fieldName = "images", maxCount = 5) =>
  upload(multerInstance.array(fieldName, maxCount));

export default multerInstance;
