"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bruteRateLimit = exports.simpleRateLimit = exports.ipBlockCleanupInterval = void 0;
/**
 * My rate limiters, and a function for limiting accounts per IP. I
 * could have used NPM packages for this but coding it myself was more
 * interesting. simpleRateLimit is used for simple limiting, for example
 * preventing spam. bruteRateLimit is used for protecting against brute
 * force attacks on user credentials.
 *
 * The parameters for the rate limiter middlewares are supposed to be
 * provided with routeName so that specific routes can be guarded with
 * different tolerances.
 *
 * This isn't going to work as intended with routes that use query
 * params, you need to fix that. Find out how to replace the actual
 * parameter value from the router path with just the name of the
 * parameter, so that for example "user/uid-123" would be treated as
 * "user/:userId". This will take some googling to find out how to do
 * but should be a little challenge.
 */
// This section is for logic. access and storage of IP block data
// It needs to be moved into a seperate file when you move onto using
// redis cache
let blockedIPsInfo = [];
const findIPBlockInfo = (ip) => blockedIPsInfo.find((info) => info.ip === ip);
const findIPBlockInfoIndex = (ip) => blockedIPsInfo.findIndex((info) => info.ip === ip);
/** This is called only for simpleRateLimit and only if the ip isn't already blocked.
 * It returns true if the ip should be blocked by the middleware
 *  **/
const simpleRateLimitTrigger = (ip, params) => {
    const ipBlockInfoIndex = findIPBlockInfoIndex(ip);
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
            simpleRateLimitWindowData[i] = Object.assign(Object.assign({}, simpleRateLimitWindowData[i]), { reqs: simpleRateLimitWindowData[i].reqs + 1 });
            if (simpleRateLimitWindowData[i].reqs >
                simpleRateLimitWindowData[i].maxReqs) {
                blockedIPsInfo[ipBlockInfoIndex].simpleRateLimitWindowData =
                    simpleRateLimitWindowData;
                return true;
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
const addSimpleRateLimiterBlock = (ip, info) => {
    var _a;
    const i = blockedIPsInfo.findIndex((info) => info.ip === ip);
    if (i !== -1) {
        const found = blockedIPsInfo[i];
        if (!found.simpleRateLimitBlocks) {
            found.simpleRateLimitBlocks = [info];
            return;
        }
        const foundSimpleBlockIndex = found.simpleRateLimitBlocks.findIndex((block) => block.routeName === info.routeName);
        if (foundSimpleBlockIndex !== -1) {
            found.simpleRateLimitBlocks[i].blockedAt = new Date().toISOString();
        }
        else {
            (_a = found.simpleRateLimitBlocks) === null || _a === void 0 ? void 0 : _a.push(info);
        }
    }
    else {
        blockedIPsInfo.push({ ip, simpleRateLimitBlocks: [info] });
    }
};
/**
 * If no route name is provided then check if its blocked on any route.
 * The routeName should be provided, but it should be able to apply a
 * middleWare to all routes as would be expected when not supplying the
 * parameter
 */
const checkBlockedBySimpleOrBruteBlock = ({ info, mode, checkBruteCooldown, routeName = "any", }) => {
    const key = `${mode}RateLimitBlocks`;
    let isBlocked = false;
    let i = info[key] ? info[key].length : 0;
    while (isBlocked === false && info[key][i] !== undefined) {
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
const simpleRateLimit = (params = {
    maxReqs: 10,
    windowMs: 1000,
    msg: "Too many requests",
    routeName: "",
    blockDuration: 5000,
}) => {
    return (req, res, next) => {
        const routeName = params.routeName === "" ? req.path : params.routeName;
        const ip = getReqIp(req);
        const ipBlockInfo = findIPBlockInfo(ip);
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
            addSimpleRateLimiterBlock(ip, {
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
        const ip = getReqIp(req);
        const ipBlockInfo = findIPBlockInfo(ip);
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
function getReqIp(req) {
    const ips = req.headers["x-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        req.socket.remoteAddress ||
        "";
    if (ips === "")
        throw new Error("Couldn't get IP from request!");
    return Array.isArray(ips)
        ? ips[0]
        : ips.includes(",")
            ? ips.split(",")[0]
            : ips;
}
