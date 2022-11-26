"use strict";
/**
 * All the functions used to access data by the rate limiting middleware stored on Redis.
 **/
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
exports.updateIPBlockInfo = exports.addIPBlockInfo = exports.addSimpleRateLimiterBlock = exports.findIPBlockInfo = void 0;
const redis_1 = __importDefault(require("../../utils/redis"));
const findIPBlockInfo = (ip) => new Promise((resolve, reject) => redis_1.default.get(`ip-info:${ip}`, (e, data) => {
    e
        ? reject(e)
        : resolve(data ? JSON.parse(data) : undefined);
}));
exports.findIPBlockInfo = findIPBlockInfo;
const addIPBlockInfo = (info) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis_1.default.set(`ip-info:${info.ip}`, JSON.stringify(info));
});
exports.addIPBlockInfo = addIPBlockInfo;
const updateIPBlockInfo = (info, original) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis_1.default.set(`ip-info:${original.ip}`, JSON.stringify(Object.assign(Object.assign({}, original), info)));
});
exports.updateIPBlockInfo = updateIPBlockInfo;
const addSimpleRateLimiterBlock = (ip, simpleBlockData) => __awaiter(void 0, void 0, void 0, function* () {
    const found = (yield findIPBlockInfo(ip));
    if (found) {
        if (!found.simpleRateLimitBlocks) {
            return yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify(Object.assign(Object.assign({}, found), { simpleRateLimitBlocks: [simpleBlockData] })));
        }
        const simpleBlockInfoIndex = found.simpleRateLimitBlocks.findIndex((block) => block.routeName === simpleBlockData.routeName);
        let simpleRateLimitBlocks = found.simpleRateLimitBlocks;
        if (simpleBlockInfoIndex !== -1) {
            simpleRateLimitBlocks[simpleBlockInfoIndex].blockedAt =
                new Date().toISOString();
            return yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify(Object.assign(Object.assign({}, found), { simpleRateLimitBlocks })));
        }
        else {
            simpleRateLimitBlocks.push(simpleBlockData);
            return yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify(Object.assign(Object.assign({}, found), { simpleRateLimitBlocks })));
        }
    }
    else {
        yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify({
            ip,
            simpleRateLimitBlocks: [simpleBlockData],
        }));
    }
});
exports.addSimpleRateLimiterBlock = addSimpleRateLimiterBlock;
