import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {type: String, required: true, trim: true},
    lastName: {type: String, required: true, trim: true},
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {type: String, required: true, minlength: 10, maxlength: 100 },
    role: {
        type: String,
        required: true,
        enum: ["house_owner", "artisan", "admin"],
        default: "house_owner",
    },
   
},
{

    timestamps: true,
},
);

const User = mongoose.model("User", userSchema);
export default User;