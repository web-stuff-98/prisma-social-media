"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../utils/authMiddleware");
const Users_controller_1 = __importDefault(require("./controllers/Users.controller"));
const router = express_1.default.Router();
router.route("/").get(Users_controller_1.default.getUsers);
router.route("/:id").get(Users_controller_1.default.getUserById);
router.route("/register").post(Users_controller_1.default.register);
router.route("/check").post(authMiddleware_1.withUser, Users_controller_1.default.checkLogin);
router.route("/login").post(Users_controller_1.default.login);
router.route("/logout").post(authMiddleware_1.withUser, Users_controller_1.default.logout);
exports.default = router;
