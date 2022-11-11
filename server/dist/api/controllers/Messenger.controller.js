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
const busboy_1 = __importDefault(require("busboy"));
const Messenger_dao_1 = __importDefault(require("../dao/Messenger.dao"));
class MessengerController {
    static uploadAttachment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const bb = (0, busboy_1.default)({ headers: req.headers });
            req.pipe(bb);
            try {
                yield Messenger_dao_1.default.uploadAttachment(bb, req.params.msgId, Number(req.params.bytes));
            }
            catch (e) {
                req.unpipe(bb);
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static sendMessage(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { message, recipientId, attachmentPending } = req.body;
                yield Messenger_dao_1.default.sendMessage(message, attachmentPending, recipientId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
            }
            catch (e) { }
        });
    }
}
exports.default = MessengerController;
