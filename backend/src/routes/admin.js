import express from "express";
import { fetchUsers } from "../controllers/admin/getUsers.js";
import { fetchUser } from "../controllers/admin/getUser.js";
import { updateUser } from "../controllers/admin/updateUser.js";
import { deleteUser, softDeleteUser, restoreUser } from "../controllers/admin/deleteUser.js";
import { requireAuth, requireRole } from "../middleware/authentication.js";
const router = express.Router()

router.use(requireAuth, requireRole("admin"));

router.get("/users", fetchUsers)
router.get("/user/:id", fetchUser)
router.patch("/user/:id", updateUser)
router.patch("/user/:id/soft-delete", softDeleteUser)
router.patch("/user/:id/restore", restoreUser)
router.delete("/user/:id", deleteUser)


export default router
