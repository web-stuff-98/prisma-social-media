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
const validateBodyMiddleware_1 = __importDefault(require("../utils/validateBodyMiddleware"));
const Yup = __importStar(require("yup"));
const yup_password_1 = __importDefault(require("yup-password"));
(0, yup_password_1.default)(Yup);
const router = express_1.default.Router();
router.route("/").get(Users_controller_1.default.getUsers);
router.route("/").post(authMiddleware_1.default, (0, express_slow_down_1.default)({
    windowMs: 20000,
    delayAfter: 5,
    delayMs: 2000,
}), (0, validateBodyMiddleware_1.default)({
    name: Yup.string().notRequired().nullable().max(24),
    pfp: Yup.string().notRequired().nullable().max(100000),
}), Users_controller_1.default.updateUser);
router.route("/:id").get((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 50,
    delayMs: 5000,
}), Users_controller_1.default.getUserById);
router.route("/register").post((0, validateBodyMiddleware_1.default)({
    username: Yup.string().required().max(24),
    password: Yup.string().password().required().max(100),
}), Users_controller_1.default.register);
router.route("/profile/:uid").get(authMiddleware_1.withUser, Users_controller_1.default.getProfile);
router.route("/profile").put(authMiddleware_1.default, (0, validateBodyMiddleware_1.default)({
    bio: Yup.string().notRequired().nullable().max(300),
    backgroundBase64: Yup.string().notRequired().nullable().max(100000),
}), Users_controller_1.default.updateProfile);
router.route("/check").post(authMiddleware_1.withUser, Users_controller_1.default.checkLogin);
router.route("/login").post((0, limiters_1.bruteRateLimit)({
    routeName: "login",
    blockDuration: 21600000,
    failsRequired: 3,
    msg: "You have made too many attempts. You will get 3 more attempts after BLOCKDURATION.",
}), (0, validateBodyMiddleware_1.default)({
    username: Yup.string().required().max(24),
    password: Yup.string().required().max(100),
}), Users_controller_1.default.login);
router.route("/logout").post(authMiddleware_1.withUser, Users_controller_1.default.logout);
exports.default = router;
