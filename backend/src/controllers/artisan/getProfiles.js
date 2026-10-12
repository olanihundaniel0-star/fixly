import Profile from "../../models/artisanProfile.js";
import { handleMongooseError } from "../../utils/errors.js";

const PROFESSIONS = [
  "Carpenter",
  "Plumber",
  "Welder",
  "Brick Layer",
  "Electrician",
  "Auto Mechanic",
  "Painter",
  "Others",
];

// GET /api/v1/artisan/profiles?profession=&search=&page=&limit=&sort=
export const getProfiles = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.profession) {
      if (!PROFESSIONS.includes(req.query.profession)) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          message: `Profession must be one of: ${PROFESSIONS.join(", ")}`,
        });
      }
      filter.profession = req.query.profession;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { professional_headline: searchRegex },
        { profession: searchRegex },
      ];
    }

    const sortField = ["createdAt", "experience_years", "starting_price"].includes(
      req.query.sortBy,
    )
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const [profiles, total] = await Promise.all([
      Profile.find(filter)
        .select("-phone_number -residential_address -office_address -__v")
        .populate("user_id", "firstName lastName role")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Profile.countDocuments(filter),
    ]);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Artisan profiles retrieved successfully",
      data: profiles,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};

// GET /api/v1/artisan/profile/:id — single profile by profile _id
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findById(id)
      .select("-phone_number -residential_address -office_address -__v")
      .populate("user_id", "firstName lastName role");

    if (!profile) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Artisan profile not found",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Artisan profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};
