import express from "express"
import { createProfile } from "../controllers/artisan/profile.js"
import { getProfileById, getProfiles } from "../controllers/artisan/getProfiles.js"
import { updateProfile } from "../controllers/artisan/updateProfile.js"
import { validateProfileCreate, validateProfileUpdate } from "../../middleware/validation.js"

const router = express.Router()

router.post("/profile", validateProfileCreate, createProfile)
router.get("/profiles", getProfiles)
router.get("/profile/:id", getProfileById)
router.patch("/profile/:id", validateProfileUpdate, updateProfile)

export default router 
