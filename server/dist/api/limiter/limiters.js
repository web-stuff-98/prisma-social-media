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
exports.bruteRateLimit = exports.bruteSuccess = exports.bruteFail = exports.simpleRateLimit = void 0;
/**
 * My rate limiters
 *
 * simpleRateLimit   <- For really simple rate limiting, block an IP on
 *                      a specific route for a certain amount of time
 *                      if they make too many requests in a given time
 *                      window.
 *
 * bruteRateLimit    <- For protecting logins. You must call bruteFail
 *                      for every failed attempt, and call bruteSuccess
 *                      when there is a success. The block duration
 *                      increases exponentially. The number of fails
 *                      required can also be configured. Default
 *                      behaviour: 2hrs, 4hrs, 8hrs, 16 hrs, et cet.
 *                      The user gets 3 attempts. Needs testing.
 */
const limiterStore_1 = require("./limiterStore");
const getReqIp_1 = __importDefault(require("../../utils/getReqIp"));
const convertMsToReadableTime_1 = __importDefault(require("../../utils/convertMsToReadableTime"));
const checkBlockedBySimpleBlock = ({ info, routeName = "", }) => __awaiter(void 0, void 0, void 0, function* () {
    let isBlocked = false;
    let i = 0;
    /* iterate through all the stored block information to check for active blocks
    matching the routeName */
    if (info.simpleRateLimitBlocks)
        while (isBlocked === false && i < info.simpleRateLimitBlocks.length - 1) {
            i++;
            if (routeName === "" ||
                info.simpleRateLimitBlocks[i].routeName === routeName) {
                const blockedAt = new Date(info.simpleRateLimitBlocks[i].blockedAt);
                const blockEnd = blockedAt.getTime() + info.simpleRateLimitBlocks[i].blockDuration;
                if (Date.now() < blockEnd)
                    isBlocked = true;
            }
        }
    return isBlocked;
});
const checkBlockedByBruteBlock = ({ info, routeName = "", }) => __awaiter(void 0, void 0, void 0, function* () {
    let isBlocked = false;
    let i = 0;
    /* iterate through all the stored block information to check for active blocks
    matching the routeName */
    if (info.bruteRateLimitData)
        while (isBlocked === false && i < info.bruteRateLimitData.length - 1) {
            i++;
            const { routeName: checkRouteName, blockDuration, failsRequired, attempts, lastAttempt, } = info.bruteRateLimitData[i];
            if (checkRouteName === routeName) {
                if (attempts % failsRequired === 0) {
                    const multiplier = attempts / failsRequired;
                    const duration = blockDuration * Math.max(1, multiplier);
                    const blockEnd = new Date(lastAttempt).getTime() + duration;
                    if (Date.now() < blockEnd) {
                        isBlocked = true;
                    }
                }
            }
        }
    return isBlocked;
});
const simpleRateLimitResponse = (res, msg, blockDuration) => {
    const outMsg = msg.replace("BLOCKDURATION", (0, convertMsToReadableTime_1.default)(blockDuration));
    return res.status(429).json({ msg: outMsg }).end();
};
/**
 * simpleRateLimit is for specific api routes. Refuses the IP if they
 * have made more than n requests within the time window. This is used
 * for stopping messenger spam for example.
 *
 * "routeName" should be the API route path as it is in the router, for
 * example "room/:roomId/message". req.url is used automatically as
 * a fallback but routeName should always be set MANUALLY for ALL API
 * routes that have query params! Otherwise you will be rate limiting
 * for specific pages and ids and so on, which is not its intended
 * behaviour
 *
 * parameters:
 *  maxReqs? = maximum number of requests in time window
 *  windowMs? = timewindow measured in ms
 *  duration? = number of milliseconds the client is blocked for
 *  msg? = the message sent back
 *  routeName = the express route, example : room/:roomId/message/like
 */
const simpleRateLimit = (params = {
    maxReqs: 10,
    windowMs: 1000,
    msg: "Too many requests. You are blocked from performing this action for BLOCKDURATION.",
    routeName: "",
    blockDuration: 5000,
}) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const ip = (0, getReqIp_1.default)(req);
        const ipBlockInfo = yield (0, limiterStore_1.findIPBlockInfo)(ip);
        if (ipBlockInfo) {
            const blocked = yield checkBlockedBySimpleBlock({
                info: ipBlockInfo,
                routeName: params.routeName,
            });
            if (blocked)
                return simpleRateLimitResponse(res, params.msg, params.blockDuration);
        }
        if (yield simpleRateLimitTrigger(ip, params)) {
            yield (0, limiterStore_1.addSimpleRateLimiterBlock)(ip, {
                routeName: params.routeName,
                blockedAt: new Date().toISOString(),
                blockDuration: params.blockDuration,
            });
            return simpleRateLimitResponse(res, params.msg, params.blockDuration);
        }
        next();
    });
};
exports.simpleRateLimit = simpleRateLimit;
const bruteFail = (ip, routeName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const found = yield (0, limiterStore_1.findIPBlockInfo)(ip);
    if (found) {
        const i = found.bruteRateLimitData
            ? (_a = found.bruteRateLimitData) === null || _a === void 0 ? void 0 : _a.findIndex((data) => data.routeName === routeName)
            : -1;
        let bruteRateLimitData = found.bruteRateLimitData || [];
        bruteRateLimitData[i] = Object.assign(Object.assign({}, bruteRateLimitData[i]), { attempts: bruteRateLimitData[i].attempts + 1, lastAttempt: new Date().toISOString() });
        yield (0, limiterStore_1.updateIPBlockInfo)({
            bruteRateLimitData,
        }, found);
    }
    else {
        throw new Error("Could not find ip block info");
    }
});
exports.bruteFail = bruteFail;
const bruteSuccess = (ip, routeName) => __awaiter(void 0, void 0, void 0, function* () {
    const found = yield (0, limiterStore_1.findIPBlockInfo)(ip);
    if (found) {
        let bruteRateLimitData = found.bruteRateLimitData || [];
        yield (0, limiterStore_1.updateIPBlockInfo)({
            bruteRateLimitData: bruteRateLimitData.filter((data) => data.routeName !== routeName),
        }, found);
    }
    else {
        throw new Error("Could not find ip block info");
    }
});
exports.bruteSuccess = bruteSuccess;
/**
 * bruteRateLimit must be using bruteFail() and bruteSuccess()
 * for it to function. Call bruteFail when there is a failure
 * case, and bruteSuccess when there is a success case.
 */
const bruteRateLimit = (params = {
    msg: "Too many requests",
    routeName: "",
    blockDuration: 1200000,
    failsRequired: 3,
}) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const ip = (0, getReqIp_1.default)(req);
        const ipBlockInfo = yield (0, limiterStore_1.findIPBlockInfo)(ip);
        if (ipBlockInfo) {
            const blocked = yield checkBlockedByBruteBlock({
                info: ipBlockInfo,
                routeName: params.routeName,
            });
            if (blocked)
                return res.status(429).json({ msg: params.msg }).end();
        }
        yield (0, limiterStore_1.prepBruteRateLimit)(params, ip);
        next();
    });
};
exports.bruteRateLimit = bruteRateLimit;
/** This is called only for simpleRateLimit and only if the ip isn't already blocked.
 * It returns true if the ip should be blocked by the middleware
 * **/
const simpleRateLimitTrigger = (ip, params) => __awaiter(void 0, void 0, void 0, function* () {
    const ipBlockInfo = yield (0, limiterStore_1.findIPBlockInfo)(ip);
    if (!ipBlockInfo) {
        yield (0, limiterStore_1.addIPBlockInfo)({
            ip,
            simpleRateLimitWindowData: [
                {
                    routeName: params.routeName,
                    timestamp: new Date().toISOString(),
                    windowDuration: Number(params.windowMs),
                    maxReqs: Number(params.maxReqs),
                    reqs: 1,
                },
            ],
        });
        return false;
    }
    if (!ipBlockInfo.simpleRateLimitWindowData) {
        yield (0, limiterStore_1.updateIPBlockInfo)({
            simpleRateLimitWindowData: [
                {
                    routeName: params.routeName,
                    timestamp: new Date().toISOString(),
                    windowDuration: Number(params.windowMs),
                    maxReqs: Number(params.maxReqs),
                    reqs: 1,
                },
            ],
        }, ipBlockInfo);
    }
    else if (ipBlockInfo) {
        let simpleRateLimitWindowData = ipBlockInfo.simpleRateLimitWindowData;
        const i = simpleRateLimitWindowData === null || simpleRateLimitWindowData === void 0 ? void 0 : simpleRateLimitWindowData.findIndex((info) => info.routeName === params.routeName);
        if (typeof i !== "undefined" && i !== -1 && simpleRateLimitWindowData[i]) {
            const isInTimeWindow = Date.now() -
                new Date(simpleRateLimitWindowData[i].timestamp).getTime() <
                simpleRateLimitWindowData[i].windowDuration;
            simpleRateLimitWindowData[i] = Object.assign(Object.assign({}, simpleRateLimitWindowData[i]), { reqs: simpleRateLimitWindowData[i].reqs + 1 });
            if (simpleRateLimitWindowData[i].reqs >=
                simpleRateLimitWindowData[i].maxReqs) {
                if (isInTimeWindow) {
                    yield (0, limiterStore_1.updateIPBlockInfo)({ simpleRateLimitWindowData }, ipBlockInfo);
                    return true;
                }
            }
            if (!isInTimeWindow) {
                simpleRateLimitWindowData = [
                    ...simpleRateLimitWindowData.filter((data) => data.routeName !== params.routeName),
                    {
                        routeName: params.routeName,
                        timestamp: new Date().toISOString(),
                        windowDuration: Number(params.windowMs),
                        maxReqs: Number(params.maxReqs),
                        reqs: 1,
                    },
                ];
            }
        }
        else {
            simpleRateLimitWindowData === null || simpleRateLimitWindowData === void 0 ? void 0 : simpleRateLimitWindowData.push({
                routeName: params.routeName,
                timestamp: new Date().toISOString(),
                windowDuration: Number(params.windowMs),
                maxReqs: Number(params.maxReqs),
                reqs: 1,
            });
        }
        yield (0, limiterStore_1.updateIPBlockInfo)({ simpleRateLimitWindowData }, ipBlockInfo);
    }
    return false;
});
