import mongoose from "mongoose";
import { PROFESSIONS } from "../constants/professions.js";

const profileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User",
      index: true,
    },
    professional_headline: { type: String, required: true, trim: true },
    profession: {
      type: String,
      required: true,
      index: true,
      enum: PROFESSIONS,
    },
    experience_years: { type: Number, required: true, min: 0 },
    rating: { type: [Number], default: [] },
    phone_number: { type: String, required: true, trim: true, minlength: 7 },
    starting_price: { type: Number, required: true, min: 0 },
    residential_address: { type: String, required: true, trim: true },
    office_address: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  },
);

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
