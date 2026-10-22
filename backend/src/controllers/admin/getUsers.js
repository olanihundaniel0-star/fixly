import User from "../../models/users.js";
import { handleMongooseError } from "../../utils/errors.js";
import {
  parsePagination,
  paginationMeta,
} from "../../utils/pagination.js";

export const fetchUsers = async (req, res) => {
  try {
    const { limit, page, skip } = parsePagination(req.query);

    // Hide soft-deleted users unless explicitly requested.
    const filter = {};
    if (req.query.includeDeleted !== "true") {
      filter.isDeleted = { $ne: true };
    }

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Users retrieved Successfully",
      data: users,
      meta: paginationMeta(total, page, limit),
    });
  } catch (e) {
    return handleMongooseError(res, e);
  }
};
