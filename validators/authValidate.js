const Joi = require("joi");

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),

  new_password: Joi.string()
    .min(6)
    .pattern(
      new RegExp("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])")
    ) 
    .invalid(Joi.ref("current_password"))
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Password must include 1 uppercase, 1 number and 1 special character",
      "any.invalid": "New password must be different from current password",
    }),
});

const resetPasswordSchema = Joi.object({
  new_password: Joi.string()
    .min(6)
    .pattern(
      new RegExp("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])")
    )
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Password must include 1 uppercase, 1 number and 1 special character",
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Confirm password must match new password",
    }),
});

module.exports = { changePasswordSchema, resetPasswordSchema };