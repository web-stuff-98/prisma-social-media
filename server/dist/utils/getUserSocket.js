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
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
exports.default = (uid) => __awaiter(void 0, void 0, void 0, function* () {
    const sockets = yield __1.io.fetchSockets();
    for (const socket of sockets) {
        if (socket.data.user.id === uid)
            return socket;
    }
    throw new Error(`Could not find socket for UID ${uid} - they are probably not logged in`);
});
