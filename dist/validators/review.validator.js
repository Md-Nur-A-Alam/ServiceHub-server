"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.reviewSchema = joi_1.default.object({
    rating: joi_1.default.number().min(1).max(5).required(),
});
