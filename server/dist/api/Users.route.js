"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importStar(require("../utils/authMiddleware"));
const Users_controller_1 = __importDefault(require("./controllers/Users.controller"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const limiters_1 = require("./limiter/limiters");
const router = express_1.default.Router();
router.route("/").get(Users_controller_1.default.getUsers);
router.route("/").post((0, express_slow_down_1.default)({
    windowMs: 20000,
    delayAfter: 5,
    delayMs: 2000,
}), authMiddleware_1.default, Users_controller_1.default.updateUser);
router.route("/:id").get((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 50,
    delayMs: 5000,
}), Users_controller_1.default.getUserById);
router.route("/register").post(Users_controller_1.default.register);
router.route("/check").post(authMiddleware_1.withUser, Users_controller_1.default.checkLogin);
router.route("/login").post((0, limiters_1.bruteRateLimit)({
    routeName: "login",
    blockDuration: 21600000,
    failsRequired: 3,
}), Users_controller_1.default.login);
router.route("/logout").post(authMiddleware_1.withUser, Users_controller_1.default.logout);
exports.default = router;
