import mongoose from "mongoose";
import User from "../../models/users.js";
import Profile from "../../models/artisanProfile.js";
import { handleMongooseError } from "../../utils/errors.js";

// DELETE /api/v1/admin/user/:id — admin hard-deletes any user (permanent).
// Removes the user doc and its artisan profile from the DB.
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

// PATCH /api/v1/admin/user/:id/soft-delete — admin soft-deletes any user.
// Flags isDeleted + deletedAt instead of removing the doc, so it can be restored.
// TODO: guard with requireAuth + requireRole("admin") once auth lands.
export const softDeleteUser = async (req, res) => {
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

    // Short-circuit if already soft-deleted.
    if (user.isDeleted) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "User already soft-deleted",
        data: { id },
      });
    }

    // Soft-delete the artisan profile if one exists.
    if (user.role === "artisan") {
      await Profile.updateOne(
        { user_id: id },
        { isDeleted: true, deletedAt: new Date() },
      );
    }

    // Flag the user itself.
    await User.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );

    // Confirm soft-deletion with the flagged id.
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "User soft-deleted successfully",
      data: { id },
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};

// PATCH /api/v1/admin/user/:id/restore — admin restores a soft-deleted user.
// Clears isDeleted + deletedAt on the user and its artisan profile.
// TODO: guard with requireAuth + requireRole("admin") once auth lands.
export const restoreUser = async (req, res) => {
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

    // Short-circuit if not soft-deleted.
    if (!user.isDeleted) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "User is not soft-deleted",
        data: { id },
      });
    }

    // Restore the artisan profile if one exists.
    if (user.role === "artisan") {
      await Profile.updateOne(
        { user_id: id },
        { isDeleted: false, deletedAt: null },
      );
    }

    // Clear the flag on the user itself.
    await User.updateOne(
      { _id: id },
      { isDeleted: false, deletedAt: null },
    );

    // Confirm restoration with the restored id.
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "User restored successfully",
      data: { id },
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};


// test hard delete later