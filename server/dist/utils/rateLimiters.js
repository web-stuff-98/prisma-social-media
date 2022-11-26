"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleRateLimit = exports.ipBlockCleanupInterval = void 0;
let blockedIPsInfo = [];
const findBlockInfo = (ip) => blockedIPsInfo.find((info) => info.ip === ip);
const addSimpleBlock = (ip, info) => {
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
const checkBlockedBySimpleOrBruteBlock = (info, mode, checkBruteCooldown) => {
    const key = `${mode}RateLimitBlocks`;
    let isBlocked = false;
    let i = info[key] ? info[key].length : 0;
    while (isBlocked === false && info[key][i] !== undefined) {
        i++;
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
                    info[key][i].blockDuration * Math.max(2, item.failTimes);
        }
        if (Date.now() < blockEnd)
            isBlocked = true;
    }
    return isBlocked;
};
const isBlockedByRegisterBlock = (info) => false;
/**
 * Determine if block information should be removed.
 */
const ipBlockCleanupInterval = () => {
    const i = setInterval(() => {
        let cleanupIps = [];
        blockedIPsInfo.forEach((info) => {
            if (checkBlockedBySimpleOrBruteBlock(info, "simple") ||
                checkBlockedBySimpleOrBruteBlock(info, "brute", true) ||
                isBlockedByRegisterBlock(info)) {
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
 * example "room/:roomId/message". routeName is set automatically but
 * should be set MANUALLY for any API route that have query params!
 *
 * parameters:
 *  maxReqs? = maximum number of requests in time window
 *  windowMs? = timewindow measured in ms
 *  duration? = number of milliseconds the client is blocked for
 *  msg? = the message sent back
 *  routeName = for example "room/:roomId/message"
 */
const simpleRateLimit = (params = {
    maxReqs: 10,
    windowMs: 1000,
    msg: "Too many requests",
    routeName: "",
}) => {
    return (req, res, next) => {
        const routeName = params.routeName === "" ? req.path : params.routeName;
        const ip = getReqIp(req);
        next();
    };
};
exports.simpleRateLimit = simpleRateLimit;
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
