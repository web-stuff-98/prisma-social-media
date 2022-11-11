"use strict";
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
const prisma_1 = __importDefault(require("../../utils/prisma"));
const prismaQueryRedisCache_1 = __importDefault(require("../../utils/prismaQueryRedisCache"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class UsersDAO {
    static getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield prisma_1.default.user.findMany({
                select: {
                    id: true,
                    name: true,
                },
            });
            return users;
        });
    }
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield (0, prismaQueryRedisCache_1.default)(`user:${id}`, prisma_1.default.user.findUnique({
                where: { id },
            }), 30);
            return user;
        });
    }
    static getUserByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const findQ = yield prisma_1.default.user.findMany({
                where: {
                    name: {
                        equals: name.trim(),
                        mode: "insensitive",
                    },
                },
            });
            return findQ[0] || undefined;
        });
    }
    static createUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const passHash = yield bcrypt_1.default.hash(password, 10);
            const user = yield prisma_1.default.user.create({
                data: {
                    name: username,
                    password: passHash,
                },
                select: {
                    id: true,
                    name: true,
                },
            });
            return user;
        });
    }
}
exports.default = UsersDAO;
