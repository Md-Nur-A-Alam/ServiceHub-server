"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
// Load environment variables
dotenv_1.default.config();
const port = process.env.PORT || 8000;
async function bootstrap() {
    try {
        await (0, db_1.connectDB)();
        app_1.default.listen(port, () => {
            console.log(`[Server]: Service Hub Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error("[Server]: Bootstrap failure:", error);
        process.exit(1);
    }
}
bootstrap();
