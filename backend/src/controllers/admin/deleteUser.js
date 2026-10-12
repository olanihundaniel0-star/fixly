import mongoose from "mongoose";
import User from "../../models/users.js";
import Profile from "../../models/artisanProfile.js";
import { handleMongooseError } from "../../utils/errors.js";

// DELETE /api/v1/admin/user/:id — admin deletes any user.
// TODO: guard with requireAuth + requireRole("admin") once auth lands.
export const deleteUser = async (req, res) => {
  try {
    // Validate the id param before hitting the DB.
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "You must provide a valid id parameter",
      });
    }

    // Find first so we return 404 for missing users.
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    // Cascade-delete the artisan profile if one exists.
    //exception for artisan
    if (user.role === "artisan") {
      await Profile.deleteOne({ user_id: id });
    }

    // Delete the user itself.
    await User.deleteOne({ _id: id });

    // Confirm deletion with the removed id.
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "User deleted successfully",
      data: { id },
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};
