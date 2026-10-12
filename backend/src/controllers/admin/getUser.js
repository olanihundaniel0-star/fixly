import mongoose from "mongoose";
import User from "../../models/users.js";
import Profile from "../../models/artisanProfile.js";
import { handleMongooseError } from "../../utils/errors.js";

export const fetchUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "You must provide a valid id parameter",
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    let artisanProfile = null;
    if (user.role === "artisan") {
      artisanProfile = await Profile.findOne({ user_id: id });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "User information retrieved successfully",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        artisanProfile,
      },
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};
