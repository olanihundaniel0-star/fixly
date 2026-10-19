import express from "express";
import { updateMe } from "../controllers/users/updateMe.js";
import { requireAuth, requireOwnership } from "../middleware/authentication.js";
import User from "../models/users.js";

const router = express.Router();
const requireSelf = requireOwnership({ model: User, ownerField: "_id" });

router.patch("/:id", requireAuth, requireSelf, updateMe);

export default router;
