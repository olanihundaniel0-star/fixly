import express from "express"
import { createProfile } from "../controllers/artisan/profile.js"
import { getMyProfile, getProfileById, getProfiles } from "../controllers/artisan/getProfiles.js"
import { updateProfile } from "../controllers/artisan/updateProfile.js"
import { validateProfileCreate, validateProfileUpdate } from "../middleware/validation.js"
import Profile from "../models/artisanProfile.js"
import {
  optionalAuth,
  requireAuth,
  requireOwnership,
  requireRole,
} from "../middleware/authentication.js"

const router = express.Router()
const requireProfileOwner = requireOwnership({
  model: Profile,
  ownerField: "user_id",
})

router.post("/profile", requireAuth, requireRole("artisan"), validateProfileCreate, createProfile)
router.get("/profiles", optionalAuth, getProfiles)
router.get("/profile/me", requireAuth, requireRole("artisan"), getMyProfile)
router.get("/profile/:id", optionalAuth, getProfileById)
router.patch("/profile/:id", requireAuth, requireProfileOwner, validateProfileUpdate, updateProfile)

export default router 
