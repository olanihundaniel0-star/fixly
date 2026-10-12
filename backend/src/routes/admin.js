import express from "express";
import { fetchUsers } from "../controllers/admin/getUsers.js";
import { fetchUser } from "../controllers/admin/getUser.js";
import { updateUser } from "../controllers/admin/updateUser.js";

const router = express.Router()

router.get("/users", fetchUsers)
router.get("/user/:id", fetchUser)
router.patch("/user/:id", updateUser)


export default router
