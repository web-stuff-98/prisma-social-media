"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Get client ip from express request
 */
exports.default = (req) => {
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
};
