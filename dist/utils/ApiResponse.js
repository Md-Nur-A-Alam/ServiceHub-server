"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(data) {
        this.success = true;
        this.data = data;
    }
}
exports.ApiResponse = ApiResponse;
exports.default = ApiResponse;
