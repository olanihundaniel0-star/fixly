import mongoose from "mongoose";
import Profile from "../../models/artisanProfile.js";
import User from "../../models/users.js";
import { handleMongooseError, isDuplicateKey } from "../../utils/errors.js";

export const createProfile = async (req, res) => {
  try {
    const {
      user_id,
      professional_headline,
      profession,
      experience_years,
      rating,
      phone_number,
      starting_price,
      residential_address,
      office_address,
    } = req.body;

    // 1. Check if user_id was provided and valid
    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "A valid user_id is required",
      });
    }

    // 2. Find the user
    const user = await User.findById(user_id);

    // 3. Check if user exists
    if (!user || user.isDeleted) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    // 4. Check if the user is an artisan
    if (user.role !== "artisan") {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message:
          "You must be an artisan in order to create a professional profile",
      });
    }

    // 5. Check if this user already has a profile
    const existingProfile = await Profile.findOne({
      user_id: user._id,
    });

    if (existingProfile) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "User profile already exists.",
      });
    }

    // 6. Create the profile
    const newProfile = await Profile.create({
      user_id: user._id,
      professional_headline,
      profession,
      experience_years,
      rating,
      phone_number,
      starting_price,
      residential_address,
      office_address,
    });

    // 7. Return successful response
    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Profile created successfully",
      data: {
        id: newProfile._id,
        user_id: newProfile.user_id,
        professional_headline: newProfile.professional_headline,
        profession: newProfile.profession,
        experience_years: newProfile.experience_years,
        rating: newProfile.rating,
        phone_number: newProfile.phone_number,
        starting_price: newProfile.starting_price,
        residential_address: newProfile.residential_address,
        office_address: newProfile.office_address,
        createdAt: newProfile.createdAt,
        updatedAt: newProfile.updatedAt,
        personal_profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    if (isDuplicateKey(error)) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "User profile already exists.",
      });
    }
    return handleMongooseError(res, error);
  }
};
