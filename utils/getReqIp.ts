import { Request } from "express";

/**
 * Get client ip from express request
 */

export default (req: Request): string => {
  const ips =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "";
  if (ips === "") throw new Error("Couldn't get IP from request!");
  return Array.isArray(ips)
    ? ips[0]
    : ips.includes(",")
    ? ips.split(",")[0]
    : ips;
};
