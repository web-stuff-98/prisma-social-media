"use strict";
/**
 * All the functions used to access data by the rate limiting middleware.
 **/
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSimpleRateLimiterBlock = exports.findIPBlockInfoIndex = exports.findIPBlockInfo = void 0;
const findIPBlockInfo = (ip) => blockedIPsInfo.find((info) => info.ip === ip);
exports.findIPBlockInfo = findIPBlockInfo;
const findIPBlockInfoIndex = (ip) => blockedIPsInfo.findIndex((info) => info.ip === ip);
exports.findIPBlockInfoIndex = findIPBlockInfoIndex;
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
exports.addSimpleRateLimiterBlock = addSimpleRateLimiterBlock;
