import mongoose from "mongoose";
import Profile from "../../models/artisanProfile.js";
import { PROFESSIONS } from "../../constants/professions.js";
import { handleMongooseError } from "../../utils/errors.js";
import {
  parsePagination,
  paginationMeta,
} from "../../utils/pagination.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getProfiles = async (req, res) => {
  try {
    const { limit, page, skip } = parsePagination(req.query);

    const filter = { isDeleted: { $ne: true } };

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
      const searchRegex = new RegExp(escapeRegExp(req.query.search.trim()), "i");
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
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    return handleMongooseError(res, error);
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "You must provide a valid id parameter",
      });
    }

    const profile = await Profile.findById(id)
      .select("-phone_number -residential_address -office_address -__v")
      .populate("user_id", "firstName lastName role");

    if (!profile || profile.isDeleted) {
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
