import User from "../../models/users.js";
import { cleanupAvatarImages, discardAvatarUpload } from "../../services/avatarImages.js";
import { handleMongooseError } from "../../utils/errors.js";

const publicAvatar = (user) => user.avatar ? { url: user.avatar.url } : null;

const currentAvatarFilter = (user) => ({
  _id: user._id,
  isDeleted: { $ne: true },
  "avatar.publicId": user.avatar?.publicId || null,
});

const conflict = (res) => res.status(409).json({
  statusCode: 409,
  success: false,
  message: "Your account or profile picture changed. Refresh and try again.",
});

export const getAvatar = (req, res) => res.status(200).json({
  statusCode: 200,
  success: true,
  data: { avatar: publicAvatar(req.user) },
});

export const putAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "No image provided (multipart field: image)",
    });
  }

  let installed = false;
  try {
    const previousId = req.user.avatar?.publicId;
    const update = { $set: { avatar: { url: req.file.path, publicId: req.file.filename } } };
    if (previousId) update.$addToSet = { avatarCleanup: previousId };
    const user = await User.findOneAndUpdate(currentAvatarFilter(req.user), update, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!user) {
      await discardAvatarUpload(req.user._id, req.file.filename);
      return conflict(res);
    }
    installed = true;
    await cleanupAvatarImages(user._id);
    const status = previousId ? 200 : 201;
    return res.status(status).json({
      statusCode: status,
      success: true,
      message: "Profile picture saved successfully",
      data: { avatar: publicAvatar(user) },
    });
  } catch (error) {
    if (!installed) await discardAvatarUpload(req.user._id, req.file.filename);
    return handleMongooseError(res, error);
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const update = { $set: { avatar: null } };
    if (req.user.avatar?.publicId) update.$addToSet = { avatarCleanup: req.user.avatar.publicId };
    const user = await User.findOneAndUpdate(currentAvatarFilter(req.user), update, {
      returnDocument: "after",
    });
    if (!user) return conflict(res);
    if (!await cleanupAvatarImages(user._id)) {
      return res.status(503).json({
        statusCode: 503,
        success: false,
        message: "Profile picture removed from your account; image cleanup is pending. Retry deletion to finish.",
        data: { avatar: null },
      });
    }
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Profile picture removed successfully",
      data: { avatar: null },
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};
