import express from "express";
import { requireAuth } from "../middleware/authentication.js";
import { uploadImage } from "../middleware/upload.js";

const router = express.Router();

// POST /api/v1/uploads/image — multipart/form-data with field `image` (jpeg/png/webp, <=5MB)
router.post("/image", requireAuth, uploadImage("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "No image provided (multipart field: image)",
    });
  }
  return res.status(201).json({
    statusCode: 201,
    success: true,
    message: "Image uploaded successfully",
    data: {
      url: req.file.path,
      publicId: req.file.filename,
      bytes: req.file.size,
    },
  });
});

export default router;
