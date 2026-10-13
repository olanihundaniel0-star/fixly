import User from "../../models/users.js";
import { handleMongooseError } from "../../utils/errors.js";

export const fetchUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

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
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    return handleMongooseError(res, e);
  }
};
