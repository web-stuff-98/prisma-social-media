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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Yup = __importStar(require("yup"));
const yup_password_1 = __importDefault(require("yup-password"));
(0, yup_password_1.default)(Yup);
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Users_dao_1 = __importDefault(require("../dao/Users.dao"));
const loginValidateSchema = Yup.object().shape({
    username: Yup.string().required().max(100),
    password: Yup.string().password().required(),
});
class UsersController {
    static getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield Users_dao_1.default.getUsers();
                res.status(200).json(users);
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield Users_dao_1.default.getUserById(req.params.id);
                if (user)
                    res.status(200).json(user);
                else
                    res.status(404).json({ msg: "Not found" });
            }
            catch (error) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ msg: "You cannot provide an empty input" });
            }
            try {
                yield loginValidateSchema.strict().validate(req.body);
            }
            catch (e) {
                return res
                    .status(400)
                    .json({ msg: `${e}`.replace("ValidationError: ", "") })
                    .end();
            }
            const foundUser = yield Users_dao_1.default.getUserByName(username);
            if (foundUser) {
                return res
                    .status(400)
                    .json({ msg: "There is a user with that name already" })
                    .end();
            }
            try {
                const user = yield Users_dao_1.default.createUser(username, password);
                res.cookie("token", jsonwebtoken_1.default.sign(JSON.stringify({ id: String(user === null || user === void 0 ? void 0 : user.id), name: user.name }), String(process.env.JWT_SECRET)), {
                    secure: process.env.NODE_ENV === "production",
                    httpOnly: true,
                    sameSite: "strict",
                });
                req.user = user;
                res.status(201).json(user).end();
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" }).end();
            }
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ msg: "You cannot provide an empty input" });
            }
            try {
                yield loginValidateSchema.strict().validate(req.body);
            }
            catch (e) {
                return res
                    .status(400)
                    .json({ msg: `${e}`.replace("ValidationError: ", "") })
                    .end();
            }
            let user;
            try {
                user = yield Users_dao_1.default.getUserByName(username);
            }
            catch (e) {
                res.status(404).json({ msg: "User does not exist" });
            }
            req.user = user;
            res.cookie("token", jsonwebtoken_1.default.sign(JSON.stringify({ id: String(user === null || user === void 0 ? void 0 : user.id), name: user === null || user === void 0 ? void 0 : user.name }), String(process.env.JWT_SECRET)), {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                sameSite: "strict",
            });
            res.status(200).json(user).end();
        });
    }
    static logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.clearCookie("token").status(200).end();
        });
    }
    static checkLogin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.status(200).json(req.user).end();
        });
    }
}
exports.default = UsersController;
