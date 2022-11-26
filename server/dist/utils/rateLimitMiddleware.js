"use strict";
/**
 * My simple rate limit middleware (no slowdown)
 *
 * window = time window in ms (default 1000ms)
 * numReqs = maximum number of requests in time window (default 8)
 * blockTime = number of ms to block the clients ip for
 * blockForRoute =
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const getIp = (req) => {
    const ips = req.headers["x-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        req.connection.remoteAddress ||
        "";
    console.log(req.originalUrl);
    console.log(req.path);
    return typeof ips === "string" ? ips.split(",")[0] : ips[0];
};
exports.default = (req, res, next) => {
    const ip = getIp(req);
    next();
};
