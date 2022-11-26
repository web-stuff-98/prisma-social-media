"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bruteRateLimit = exports.simpleRateLimit = exports.ipBlockCleanupInterval = void 0;
/**
 * My rate limiters
 *
 * I could have used packages for this but coding it myself was more
 * interesting and seemed like a good way to just get some more general
 * practice with structuring my code, writing comments and getting more
 * familiar with using modules and typescript to build stuff
 *
 * simpleRateLimit   <- For really simple rate limiting, block an IP on
 *                      a specific route for a certain amount of time
 *                      if they make too many requests in a given time
 *                      window.
 *
 * bruteRateLimit    <- bruteRate limit doubles the IP block time for
 *                      every failed request, but it needs to be used
 * + bruteFail          with bruteFail and bruteSuccess to work
 * + bruteSuccess       properly. Call bruteFail from inside your API
 *                      route for example when the user puts in the
 *                      wrong password. Call bruteSuccess to remove the
 *                      IP block for that route, for example when a
 *                      user logs in successfully.
 *
 * There are better explanations in the comments for the functions
 * that give extra information for providing parameters.
 *
 * If you don't provide a unique routeName into the middleware
 * parameters the rate limiter will act globally for every instance of
 * the middleware where the routeName wasn't provided. You are supposed
 * to provide the routeName but leaving it blank should cause this
 * behaviour if you really want it to.
 *
 * The routeName can be named anything, but it should be unique. It is
 * best to just use the string for the route that you provided to
 * express router.
 */
const limiterStore_1 = require("./limiterStore");
const getReqIp_1 = __importDefault(require("../../utils/getReqIp"));
const checkBlockedBySimpleOrBruteBlock = ({ info, mode, checkBruteCooldown, routeName = "any", }) => {
    const key = `${mode}RateLimitBlocks`;
    let isBlocked = false;
    const hasKey = info[key] ? true : false;
    let i = 0;
    console.log(JSON.stringify(info));
    /* iterate through all the stored block information to check for active blocks
    matching the routeName */
    if (hasKey)
        while (isBlocked === false && i < info[key].length - 1) {
            i++;
            if (routeName === "any" || info[key][i].routeName === routeName) {
                const blockedAt = new Date(info[key][i].blockedAt);
                let blockEnd;
                if (!checkBruteCooldown) {
                    blockEnd = blockedAt.getTime() + info[key][i].blockDuration;
                }
                else {
                    if (mode !== "brute") {
                        throw new Error("checkBruteCooldown is used only with brute mode");
                    }
                    const item = info[key][i];
                    blockEnd =
                        blockedAt.getTime() +
                            item.blockDuration * Math.max(2, item.failTimes);
                }
                if (Date.now() < blockEnd)
                    isBlocked = true;
            }
        }
    return isBlocked;
};
/**
 * Determine if a block for an IP should be removed, then remove it.
 * There is a better way of doing this, which is by checking if the
 * block should be removed directly from the middleware instead of
 * checking at an interval. You should upgrade this.
 */
const ipBlockCleanupInterval = () => {
    const i = setInterval(() => {
        let cleanupIps = [];
        blockedIPsInfo.forEach((info) => {
            if (checkBlockedBySimpleOrBruteBlock({
                info,
                mode: "simple",
                routeName: "any",
            }) ||
                checkBlockedBySimpleOrBruteBlock({
                    info,
                    mode: "brute",
                    checkBruteCooldown: true,
                    routeName: "any",
                })) {
                cleanupIps.push(info.ip);
            }
        });
        blockedIPsInfo;
    }, 1000);
    return () => clearInterval(i);
};
exports.ipBlockCleanupInterval = ipBlockCleanupInterval;
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
    msg: "Too many requests",
    routeName: "",
    blockDuration: 5000,
}) => {
    return (req, res, next) => {
        const routeName = params.routeName === "" ? req.path : params.routeName;
        const ip = (0, getReqIp_1.default)(req);
        const ipBlockInfo = (0, limiterStore_1.findIPBlockInfo)(ip);
        if (ipBlockInfo) {
            const blocked = checkBlockedBySimpleOrBruteBlock({
                info: ipBlockInfo,
                mode: "simple",
                routeName,
            });
            if (blocked)
                return res.status(429).json({ msg: params.msg }).end();
        }
        if (simpleRateLimitTrigger(ip, params)) {
            (0, limiterStore_1.addSimpleRateLimiterBlock)(ip, {
                routeName: params.routeName,
                blockedAt: new Date().toISOString(),
                blockDuration: params.blockDuration,
            });
            return res.status(429).json({ msg: params.msg }).end();
        }
        next();
    };
};
exports.simpleRateLimit = simpleRateLimit;
/**
 * This is similar to simpleRateLimit, but intended for guarding logins.
 *
 * The more fails the longer it takes, using
 * (duration * min(4, max(1, number of fails)))
 * to calculate the cooldown period where 4 is the maximum number of
 * times the duration can be multiplied by default.
 *
 * Because bruteRateLimit is not automatic like simpleRateLimit you
 * need to call failBrute("the name of the routeName you passed in")
 * whenever a failure happens for this to work as intended. Call
 * successBrute("the routeName") when you need the block cleared after
 * success (for example after successfully logging in)
 *
 * "routeName" should be the API route path as it is in the router, for
 * example "room/:roomId/message". req.url is used automatically as
 * a fallback but routeName should always be set MANUALLY for ALL API
 * routes that have query params! Otherwise you will be rate limiting
 * for specific pages and ids and so on, which is not its intended
 * behaviour
 *
 * parameters:
 *  maxMultiplication? = maximum number to use in calculating cooldown
 *  duration? = number of milliseconds the client is blocked for
 *  msg? = the message sent back
 *  routeName = the express route, example : room/:roomId/message/like
 *
 * maxMultiplication is at 4 by default, and the duration is set to
 * 3 hours. Which means after failing 4 times the block duration would
 * be 12 hours after the last failure.
 */
const bruteRateLimit = (params = {
    maxMultiplication: 4,
    duration: 3600000,
    msg: "Too many requests",
    routeName: "",
}) => {
    return (req, res, next) => {
        const routeName = params.routeName || req.path;
        const ip = (0, getReqIp_1.default)(req);
        const ipBlockInfo = (0, limiterStore_1.findIPBlockInfo)(ip);
        if (ipBlockInfo) {
            const blocked = checkBlockedBySimpleOrBruteBlock({
                info: ipBlockInfo,
                mode: "brute",
                routeName,
            });
            if (blocked)
                return res.status(429).json({ msg: params.msg }).end();
        }
        next();
    };
};
exports.bruteRateLimit = bruteRateLimit;
/** This is called only for simpleRateLimit and only if the ip isn't already blocked.
 * It returns true if the ip should be blocked by the middleware
 * **/
const simpleRateLimitTrigger = (ip, params) => {
    const ipBlockInfoIndex = (0, limiterStore_1.findIPBlockInfoIndex)(ip);
    if (ipBlockInfoIndex === -1) {
        blockedIPsInfo.push({
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
    if (!blockedIPsInfo[ipBlockInfoIndex].simpleRateLimitWindowData) {
        blockedIPsInfo[ipBlockInfoIndex] = Object.assign(Object.assign({}, blockedIPsInfo[ipBlockInfoIndex]), { simpleRateLimitWindowData: [
                {
                    routeName: params.routeName,
                    timestamp: new Date().toISOString(),
                    windowDuration: Number(params.windowMs),
                    maxReqs: Number(params.maxReqs),
                    reqs: 1,
                },
            ] });
    }
    else if (blockedIPsInfo[ipBlockInfoIndex]) {
        let simpleRateLimitWindowData = blockedIPsInfo[ipBlockInfoIndex].simpleRateLimitWindowData;
        const i = simpleRateLimitWindowData === null || simpleRateLimitWindowData === void 0 ? void 0 : simpleRateLimitWindowData.findIndex((info) => info.routeName === params.routeName);
        if (typeof i !== "undefined" && i !== -1 && simpleRateLimitWindowData[i]) {
            const isInTimeWindow = Date.now() -
                new Date(simpleRateLimitWindowData[i].timestamp).getTime() <
                simpleRateLimitWindowData[i].windowDuration;
            simpleRateLimitWindowData[i] = Object.assign(Object.assign({}, simpleRateLimitWindowData[i]), { reqs: simpleRateLimitWindowData[i].reqs + 1 });
            if (simpleRateLimitWindowData[i].reqs >=
                simpleRateLimitWindowData[i].maxReqs) {
                if (isInTimeWindow) {
                    blockedIPsInfo[ipBlockInfoIndex].simpleRateLimitWindowData =
                        simpleRateLimitWindowData;
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
        blockedIPsInfo[ipBlockInfoIndex].simpleRateLimitWindowData =
            simpleRateLimitWindowData;
    }
    return false;
};
