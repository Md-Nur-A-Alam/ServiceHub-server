import Joi from "joi";

export const serviceSchema = Joi.object({
  title: Joi.string().required(),
});
