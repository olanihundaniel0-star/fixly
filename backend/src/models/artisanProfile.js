import mongoose from "mongoose";

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
      enum: [
        "Carpenter",
        "Plumber",
        "Welder",
        "Brick Layer",
        "Electrician",
        "Auto Mechanic",
        "Painter",
        "Others",
      ],
    },
    experience_years: { type: Number, required: true, min: 0 },
    rating: { type: [Number], default: [] },
    phone_number: { type: String, required: true, trim: true, minlength: 7 },
    starting_price: { type: Number, required: true, min: 0 },
    residential_address: { type: String, required: true, trim: true },
    office_address: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  },
);

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
