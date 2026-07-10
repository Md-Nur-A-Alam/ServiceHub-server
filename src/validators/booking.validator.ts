import Joi from "joi";

export const bookingSchema = Joi.object({
  serviceId: Joi.string().required(),
});
