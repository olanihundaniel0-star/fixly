export const isDuplicateKey = (error) => error?.code === 11000;

export const isValidationError = (error) => error?.name === "ValidationError";

export const isCastError = (error) => error?.name === "CastError";

export const handleMongooseError = (res, error) => {
  if (isDuplicateKey(error)) {
    return res.status(409).json({
      statusCode: 409,
      success: false,
      message: "Duplicate value: resource already exists",
    });
  }
  if (isValidationError(error) || isCastError(error)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }
  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: "Internal Server Error",
    error: error.message,
  });
};
