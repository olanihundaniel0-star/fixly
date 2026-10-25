import bcrypt from "bcryptjs";
import User from "../../models/users.js";
import { handleMongooseError, isDuplicateKey } from "../../utils/errors.js";

export const register = async (req, res) => {
    try {
        //step 1: get data from users
        const { firstName, lastName, email, password, role } = req.body;
        //step 2: check if user already exist
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                statusCode: 409,
                success: false,
                message: "User with this email already exists!",
            });
        }

        //step3: salt + hash password and create user
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        let user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
        });

        //step4: generate and send response
        if (user) {
            return res.status(201).json({
                statusCode: 201,
                success: true,
                message: "User registered Successfully",
                data: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    avatar: null,
                }
            });
        }
    } catch (error) {
        console.error(`Registration error: ${error.message}`);
        if (isDuplicateKey(error)) {
            return res.status(409).json({
                statusCode: 409,
                success: false,
                message: "User with this email already exists!",
            });
        }
        return handleMongooseError(res, error);
    }

};

