import User from "../models/users.js";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const destroyImage = async (publicId) => {
  if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured");
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
    timeout: 15000,
  });
  if (!["ok", "not found"].includes(result.result)) {
    throw new Error("Cloudinary did not confirm image deletion");
  }
};

const logPending = (publicId) => console.error("Avatar cleanup pending:", publicId);

export const cleanupAvatarImages = async (userId) => {
  const user = await User.findById(userId).select("+avatar.publicId +avatarCleanup");
  if (!user) return true;

  let complete = true;
  for (const publicId of user.avatarCleanup) {
    if (publicId === user.avatar?.publicId) continue;
    try {
      await destroyImage(publicId);
      await User.updateOne({ _id: userId }, { $pull: { avatarCleanup: publicId } });
    } catch {
      logPending(publicId);
      complete = false;
    }
  }
  return complete;
};

export const discardAvatarUpload = async (userId, publicId) => {
  try {
    const queued = await User.updateOne(
      { _id: userId },
      { $addToSet: { avatarCleanup: publicId } },
    );
    if (queued.matchedCount) return await cleanupAvatarImages(userId);
    await destroyImage(publicId);
    return true;
  } catch {
    logPending(publicId);
    return false;
  }
};
