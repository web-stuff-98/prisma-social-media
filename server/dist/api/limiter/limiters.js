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
exports.bruteRateLimit = exports.simpleRateLimit = exports.ipBlockCleanupInterval = void 0;
/**
 * My rate limiters
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
 * routeName needs to be provided and should be unique for the route
 * it's applied on, but the same routeName can be used for multiple
 * routes.
 */
const limiterStore_1 = require("./limiterStore");
const getReqIp_1 = __importDefault(require("../../utils/getReqIp"));
const checkBlockedBySimpleOrBruteBlock = ({ info, mode, checkBruteCooldown, routeName = "any", }) => __awaiter(void 0, void 0, void 0, function* () {
    const key = `${mode}RateLimitBlocks`;
    let isBlocked = false;
    const hasKey = info[key] ? true : false;
    let i = 0;
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
});
/**
 * Determine if a block for an IP should be removed, then remove it.
 * There is a better way of doing this, which is by checking if the
 * block should be removed directly from the middleware instead of
 * checking at an interval. You should upgrade this.
 */
const ipBlockCleanupInterval = () => __awaiter(void 0, void 0, void 0, function* () {
    const i = setInterval(() => {
        let cleanupIps = [];
        blockedIPsInfo.forEach((info) => __awaiter(void 0, void 0, void 0, function* () {
            if ((yield checkBlockedBySimpleOrBruteBlock({
                info,
                mode: "simple",
                routeName: "any",
            })) ||
                (yield checkBlockedBySimpleOrBruteBlock({
                    info,
                    mode: "brute",
                    checkBruteCooldown: true,
                    routeName: "any",
                }))) {
                cleanupIps.push(info.ip);
            }
        }));
        blockedIPsInfo;
    }, 1000);
    return () => clearInterval(i);
});
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
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const routeName = params.routeName === "" ? req.path : params.routeName;
        const ip = (0, getReqIp_1.default)(req);
        const ipBlockInfo = yield (0, limiterStore_1.findIPBlockInfo)(ip);
        if (ipBlockInfo) {
            const blocked = yield checkBlockedBySimpleOrBruteBlock({
                info: ipBlockInfo,
                mode: "simple",
                routeName,
            });
            if (blocked)
                return res.status(429).json({ msg: params.msg }).end();
        }
        if (yield simpleRateLimitTrigger(ip, params)) {
            yield (0, limiterStore_1.addSimpleRateLimiterBlock)(ip, {
                routeName: params.routeName,
                blockedAt: new Date().toISOString(),
                blockDuration: params.blockDuration,
            });
            return res.status(429).json({ msg: params.msg }).end();
        }
        next();
    });
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
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const routeName = params.routeName || req.path;
        const ip = (0, getReqIp_1.default)(req);
        const ipBlockInfo = yield (0, limiterStore_1.findIPBlockInfo)(ip);
        if (ipBlockInfo) {
            const blocked = yield checkBlockedBySimpleOrBruteBlock({
                info: ipBlockInfo,
                mode: "brute",
                routeName,
            });
            if (blocked)
                return res.status(429).json({ msg: params.msg }).end();
        }
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
/*
const simpleRateLimitTrigger = (
  ip: string,
  params: SimpleRateLimitParams
): boolean => {
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
  if (!blockedIPsInfo[ipBlockInfoIndex]!.simpleRateLimitWindowData) {
    blockedIPsInfo[ipBlockInfoIndex] = {
      ...blockedIPsInfo[ipBlockInfoIndex],
      simpleRateLimitWindowData: [
        {
          routeName: params.routeName,
          timestamp: new Date().toISOString(),
          windowDuration: Number(params.windowMs),
          maxReqs: Number(params.maxReqs),
          reqs: 1,
        },
      ],
    };
  } else if (blockedIPsInfo[ipBlockInfoIndex]) {
    let simpleRateLimitWindowData =
      blockedIPsInfo[ipBlockInfoIndex].simpleRateLimitWindowData;
    const i = simpleRateLimitWindowData?.findIndex(
      (info) => info.routeName === params.routeName
    );
    if (typeof i !== "undefined" && i !== -1 && simpleRateLimitWindowData![i]) {
      const isInTimeWindow =
        Date.now() -
          new Date(simpleRateLimitWindowData![i].timestamp).getTime() <
        simpleRateLimitWindowData![i].windowDuration;

      simpleRateLimitWindowData![i] = {
        ...simpleRateLimitWindowData![i],
        reqs: simpleRateLimitWindowData![i].reqs + 1,
      } as SimpleRateLimitWindowData;
      if (
        simpleRateLimitWindowData![i].reqs >=
        simpleRateLimitWindowData![i].maxReqs
      ) {
        if (isInTimeWindow) {
          blockedIPsInfo[ipBlockInfoIndex].simpleRateLimitWindowData =
            simpleRateLimitWindowData;
          return true;
        }
      }
      if (!isInTimeWindow) {
        simpleRateLimitWindowData = [
          ...simpleRateLimitWindowData!.filter(
            (data) => data.routeName !== params.routeName
          ),
          {
            routeName: params.routeName,
            timestamp: new Date().toISOString(),
            windowDuration: Number(params.windowMs),
            maxReqs: Number(params.maxReqs),
            reqs: 1,
          },
        ];
      }
    } else {
      simpleRateLimitWindowData?.push({
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

*/