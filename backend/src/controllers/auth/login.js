import bcrypt from "bcryptjs";
import User from "../../models/users.js";
import { generateToken } from "../../utils/jwt.js";

export const login = async (req, res) => {
    try {
        //step 1: get credentials
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                statusCode: 400,
                success: false,
                message: "Email and password are required",
            });
        }

        //step 2: find user (hide existence + soft-deleted accounts)
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || user.isDeleted) {
            return res.status(401).json({
                statusCode: 401,
                success: false,
                message: "Invalid email or password",
            });
        }

        //step 3: verify password against salted bcrypt hash from register
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                statusCode: 401,
                success: false,
                message: "Invalid email or password",
            });
        }

        //step 4: issue JWT
        const token = generateToken(user);

        //step 5: send response (never return password hash)
        return res.status(200).json({
            statusCode: 200,
            success: true,
            message: "Login successful",
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token,
            },
        });
    } catch (error) {
        console.error(`Login error: ${error.message}`);
        return res.status(500).json({
            statusCode: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
