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

        //step3: create user
        let user = await User.create({
            firstName,
            lastName,
            email,
            password,
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

