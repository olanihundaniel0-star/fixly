import Joi from "joi";

const registerValidationSchema = Joi.object({
  firstName: Joi.string().trim().required().messages({
    "string.base": "First Name must be a text",
    "string.empty": "First Name cannot be empty",
    "any.required": "First Name is required",
  }),
  lastName: Joi.string().trim().required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string()
    .min(10)
    .max(100)
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{10,100}$")),
  confirmPassword: Joi.any().valid(Joi.ref("password")).messages({
    "any.only": "Passwords do not match",
  }),
  role: Joi.string()
    .valid("house_owner", "artisan", "admin")
    .default("house_owner")
    .messages({
      "any.only": "Role must be either house_owner, Artisan or Admin",
    }),
});

const loginValidationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});
const PROFESSIONS = [
  "Carpenter",
  "Plumber",
  "Welder",
  "Brick Layer",
  "Electrician",
  "Auto Mechanic",
  "Painter",
  "Others",
];

const profileCreateSchema = Joi.object({
  user_id: Joi.string().hex().length(24).required().messages({
    "string.length": "user_id must be a valid ObjectId",
    "any.required": "user_id is required",
  }),
  professional_headline: Joi.string().trim().min(3).required().messages({
    "string.base": "Professional Headline must be a text",
    "string.empty": "Professional Headline cannot be empty",
    "any.required": "professional Headline is required",
  }),
  profession: Joi.string()
    .required()
    .valid(...PROFESSIONS)
    .messages({
      "any.only": `Profession must be one of the following: ${PROFESSIONS.join(", ")}`,
    }),
  experience_years: Joi.number().min(0).required().messages({
    "number.base": "Experience years must be a number",
    "number.min": "Experience years cannot be negative",
    "any.required": "Experience years is required",
  }),
  rating: Joi.array().items(Joi.number().min(1).max(5)).optional(),
  phone_number: Joi.string().trim().min(7).required(),
  starting_price: Joi.number().min(0).required(),
  residential_address: Joi.string().trim().min(3).required(),
  office_address: Joi.string().trim().min(3).required(),
});

const profileUpdateSchema = Joi.object({
  professional_headline: Joi.string().trim().min(3),
  profession: Joi.string().valid(...PROFESSIONS).messages({
    "any.only": `Profession must be one of the following: ${PROFESSIONS.join(", ")}`,
  }),
  experience_years: Joi.number().min(0).messages({
    "number.base": "Experience years must be a number",
    "number.min": "Experience years cannot be negative",
  }),
  phone_number: Joi.string().trim().min(7),
  starting_price: Joi.number().min(0),
  residential_address: Joi.string().trim().min(3),
  office_address: Joi.string().trim().min(3),
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

export { registerValidationSchema, loginValidationSchema, profileCreateSchema, profileUpdateSchema };
