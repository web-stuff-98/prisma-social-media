"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const redisClient = process.env.REDISCLOUD_URL ? new ioredis_1.default(process.env.REDISCLOUD_URL) : new ioredis_1.default();
exports.default = redisClient;
