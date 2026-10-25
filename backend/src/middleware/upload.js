import multer from "multer";
import { randomUUID } from "node:crypto";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { discardAvatarUpload } from "../services/avatarImages.js";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: () => process.env.CLOUDINARY_FOLDER || "fixly",
  },
});

const filterImage = (req, file, cb) => {
    if (!IMAGE_TYPES.includes(file.mimetype)) {
      const error = new Error("Only JPEG, PNG or WEBP images are allowed");
      error.statusCode = 400;
      return cb(error);
    }
    return cb(null, true);
};

const multerInstance = multer({
  storage,
  fileFilter: filterImage,
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

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: (req) => ({
    folder: `${process.env.CLOUDINARY_FOLDER || "fixly"}/avatars/${req.user._id}`,
    public_id: randomUUID(),
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    format: "webp",
    transformation: [{ width: 512, height: 512, crop: "fill", gravity: "auto", quality: "auto" }],
    timeout: 30000,
  }),
});

avatarStorage._removeFile = (req, file, callback) => {
  discardAvatarUpload(req.user._id, file.filename).then(() => callback(), callback);
};

export const uploadAvatar = upload(multer({
  storage: avatarStorage,
  fileFilter: filterImage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 0 },
}).single("image"));

export default multerInstance;
