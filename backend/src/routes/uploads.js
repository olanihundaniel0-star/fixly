import express from "express";
import { requireAuth } from "../middleware/authentication.js";

const router = express.Router();

// Retired: uploads must be attached to an account so they can be cleaned up.
router.post("/image", requireAuth, (req, res) => {
  return res.status(410).json({
    statusCode: 410,
    success: false,
    message: "General image uploads have been retired. Use PUT /api/v1/users/me/avatar for profile pictures.",
  });
});

export default router;
