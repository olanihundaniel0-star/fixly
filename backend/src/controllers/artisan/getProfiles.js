import mongoose from "mongoose";
import Profile from "../../models/artisanProfile.js";
import User from "../../models/users.js";
import { PROFESSIONS } from "../../constants/professions.js";
import { handleMongooseError, QueryValidationError } from "../../utils/errors.js";
import {
  parsePagination,
  paginationMeta,
} from "../../utils/pagination.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getProfiles = async (req, res) => {
  try {
    const { limit, page, skip } = parsePagination(req.query);

    for (const key of ["search", "profession", "sortBy", "order"]) {
      if (req.query[key] !== undefined && typeof req.query[key] !== "string") {
        throw new QueryValidationError(`${key} must be a single string`);
      }
    }
    if (req.query.search?.length > 200) {
      throw new QueryValidationError("search must not exceed 200 characters");
    }

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

    const [result] = await Profile.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: User.collection.name,
          localField: "user_id",
          foreignField: "_id",
          pipeline: [
            { $match: { role: "artisan", isDeleted: { $ne: true } } },
            { $project: { firstName: 1, lastName: 1, role: 1, "avatar.url": 1 } },
          ],
          as: "user_id",
        },
      },
      { $unwind: "$user_id" },
      {
        $facet: {
          profiles: [
            { $sort: { [sortField]: sortOrder, _id: sortOrder } },
            { $skip: skip },
            { $limit: limit },
            { $project: { phone_number: 0, residential_address: 0, office_address: 0, __v: 0 } },
            {
              $set: {
                id: { $toString: "$_id" },
                "user_id.id": { $toString: "$user_id._id" },
                "user_id.avatar": { $ifNull: ["$user_id.avatar", null] },
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);
    const profiles = result.profiles;
    const total = result.total[0]?.count || 0;

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
      .populate({
        path: "user_id",
        select: "firstName lastName role avatar.url",
        match: { role: "artisan", isDeleted: { $ne: true } },
      });

    if (!profile || profile.isDeleted || !profile.user_id) {
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
