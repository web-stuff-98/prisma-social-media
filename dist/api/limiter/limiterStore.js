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
exports.updateIPBlockInfo = exports.addIPBlockInfo = exports.addSimpleRateLimiterBlock = exports.findIPBlockInfo = exports.prepBruteRateLimit = void 0;
const redis_1 = __importDefault(require("../../utils/redis"));
const findIPBlockInfo = (ip) => new Promise((resolve, reject) => redis_1.default.get(`ip-info:${ip}`, (e, data) => {
    e
        ? reject(e)
        : resolve(data ? JSON.parse(data) : undefined);
}));
exports.findIPBlockInfo = findIPBlockInfo;
/**
 * look through all the block data for the IP to find out what the
 * expiration date for the key should be. returns ms to expiry.
 */
const getExpirationMsFromIPBlockInfo = (info) => {
    let latestBlockEnd = Date.now() + 5000; //minimum expiry of 5 seconds
    if (info.bruteRateLimitData) {
        info.bruteRateLimitData.forEach((data) => {
            const blockEnd = new Date(data.lastAttempt).getTime() +
                data.blockDuration *
                    Math.max(data.failsRequired * Math.ceil(data.attempts / data.failsRequired), 1);
            if (blockEnd > latestBlockEnd)
                latestBlockEnd = blockEnd;
        });
    }
    if (info.simpleRateLimitBlocks) {
        info.simpleRateLimitBlocks.forEach((data) => {
            const blockEnd = new Date(data.blockedAt).getTime() + data.blockDuration;
            if (blockEnd > latestBlockEnd)
                latestBlockEnd = blockEnd;
        });
    }
    if (info.simpleRateLimitWindowData) {
        info.simpleRateLimitWindowData.forEach((data) => {
            const end = new Date(data.timestamp).getTime() + data.windowDuration;
            if (end > latestBlockEnd)
                latestBlockEnd = end;
        });
    }
    return latestBlockEnd - Date.now();
};
const addIPBlockInfo = (info) => {
    const expiration = getExpirationMsFromIPBlockInfo(info);
    redis_1.default.set(`ip-info:${info.ip}`, JSON.stringify(info), "PX", expiration);
};
exports.addIPBlockInfo = addIPBlockInfo;
const updateIPBlockInfo = (info, original) => __awaiter(void 0, void 0, void 0, function* () {
    const data = Object.assign(Object.assign({}, original), info);
    const expiration = getExpirationMsFromIPBlockInfo(data);
    yield redis_1.default.set(`ip-info:${original.ip}`, JSON.stringify(data), "PX", expiration);
});
exports.updateIPBlockInfo = updateIPBlockInfo;
const prepBruteRateLimit = (params, ip) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const found = yield findIPBlockInfo(ip);
    if (!found) {
        yield addIPBlockInfo({
            ip,
            bruteRateLimitData: [
                Object.assign(Object.assign({}, params), { attempts: 0, lastAttempt: "" }),
            ],
        });
    }
    else {
        const i = found.bruteRateLimitData
            ? (_a = found.bruteRateLimitData) === null || _a === void 0 ? void 0 : _a.findIndex((data) => data.routeName === params.routeName)
            : -1;
        let bruteRateLimitData = found.bruteRateLimitData || [];
        if (i === -1) {
            yield updateIPBlockInfo({
                bruteRateLimitData: [
                    ...bruteRateLimitData,
                    Object.assign(Object.assign({}, params), { attempts: 0, lastAttempt: "" }),
                ],
            }, found);
        }
    }
});
exports.prepBruteRateLimit = prepBruteRateLimit;
const addSimpleRateLimiterBlock = (ip, simpleBlockData) => __awaiter(void 0, void 0, void 0, function* () {
    const found = (yield findIPBlockInfo(ip));
    if (found) {
        if (!found.simpleRateLimitBlocks) {
            const data = Object.assign(Object.assign({}, found), { simpleRateLimitBlocks: [simpleBlockData] });
            const expiration = getExpirationMsFromIPBlockInfo(data);
            return yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify(data), "PX", expiration);
        }
        const simpleBlockInfoIndex = found.simpleRateLimitBlocks.findIndex((block) => block.routeName === simpleBlockData.routeName);
        let simpleRateLimitBlocks = found.simpleRateLimitBlocks;
        if (simpleBlockInfoIndex !== -1) {
            simpleRateLimitBlocks[simpleBlockInfoIndex].blockedAt =
                new Date().toISOString();
            const data = Object.assign(Object.assign({}, found), { simpleRateLimitBlocks });
            const expiration = getExpirationMsFromIPBlockInfo(data);
            return yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify(data), "PX", expiration);
        }
        else {
            simpleRateLimitBlocks.push(simpleBlockData);
            const data = Object.assign(Object.assign({}, found), { simpleRateLimitBlocks });
            const expiration = getExpirationMsFromIPBlockInfo(data);
            return yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify(data), "PX", expiration);
        }
    }
    else {
        const data = {
            ip,
            simpleRateLimitBlocks: [simpleBlockData],
        };
        const expiration = getExpirationMsFromIPBlockInfo(data);
        yield redis_1.default.set(`ip-info:${ip}`, JSON.stringify(data), "PX", expiration);
    }
});
exports.addSimpleRateLimiterBlock = addSimpleRateLimiterBlock;
