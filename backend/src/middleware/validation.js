import {
  registerValidationSchema,
  profileCreateSchema,
  profileUpdateSchema,
} from "../validation/auth.js";

const formatJoiError = (error) =>
  error.details.map((d) => d.message);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Validation failed",
      errors: formatJoiError(error),
    });
  }

  req.body = value;
  next();
};

export const validateRegistration = validate(registerValidationSchema);
export const validateProfileCreate = validate(profileCreateSchema);
export const validateProfileUpdate = validate(profileUpdateSchema);
