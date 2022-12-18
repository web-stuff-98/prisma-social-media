"use strict";
/**
 * Returns the socket so that you don't have to fetch all the sockets twice.
 * Returns false if the user isn't in the room
 */
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
exports.default = (uid, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const sockets = yield __1.io.fetchSockets();
    const socket = sockets.find((s) => s.data.user.id === uid);
    return socket
        ? ((_a = __1.io.sockets.adapter.socketRooms(socket.id)) === null || _a === void 0 ? void 0 : _a.has(`room=${roomId}`))
            ? socket
            : false
        : false;
});
