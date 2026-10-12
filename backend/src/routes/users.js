import express from "express";
import { updateMe } from "../controllers/users/updateMe.js";

const router = express.Router();

router.patch("/:id", updateMe);

export default router;
