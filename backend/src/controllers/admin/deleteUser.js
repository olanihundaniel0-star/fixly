import mongoose from "mongoose";
import User from "../../models/users.js";
import Profile from "../../models/artisanProfile.js";
import { handleMongooseError } from "../../utils/errors.js";
import { cleanupAvatarImages } from "../../services/avatarImages.js";

const validId = (id, res) => {
  if (id && mongoose.Types.ObjectId.isValid(id)) return true;
  res.status(400).json({
    statusCode: 400,
    success: false,
    message: "You must provide a valid id parameter",
  });
  return false;
};

const notFound = (res) => res.status(404).json({
  statusCode: 404,
  success: false,
  message: "User not found",
});

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id, res)) return;

    const account = await User.findOneAndUpdate({ _id: id }, {
      $set: { isDeleted: true, deletedAt: new Date() },
      $inc: { avatarVersion: 1 },
    }, { returnDocument: "after" }).select("+avatar.publicId");
    if (account?.avatar?.publicId) {
      await User.updateOne({ _id: id }, {
        $set: { avatar: null },
        $addToSet: { avatarCleanup: account.avatar.publicId },
      });
    }
    if (account && !await cleanupAvatarImages(id)) {
      return res.status(503).json({
        statusCode: 503,
        success: false,
        message: "Account deactivated; image cleanup is pending. Retry deletion to finish.",
      });
    }

    const user = await User.deleteOne({ _id: id });
    const profile = await Profile.deleteOne({ user_id: id });
    if (!user.deletedCount && !profile.deletedCount) return notFound(res);

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

const setDeletionState = (isDeleted) => async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id, res)) return;

    const user = await User.findById(id);
    if (!user) return notFound(res);

    const deletedAt = isDeleted ? (user.deletedAt || new Date()) : null;
    const state = { isDeleted, deletedAt };
    const updated = await User.updateOne({ _id: id }, {
      $set: state,
      $inc: { avatarVersion: 1 },
    });
    if (!updated.matchedCount) return notFound(res);
    await Profile.updateOne({ user_id: id }, state);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: isDeleted ? "User soft-deleted successfully" : "User restored successfully",
      data: { id },
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};

export const softDeleteUser = setDeletionState(true);
export const restoreUser = setDeletionState(false);
