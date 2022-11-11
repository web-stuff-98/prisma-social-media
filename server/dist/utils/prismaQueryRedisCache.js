"use strict";
/**
 * Not sure why i am using Redis cache
 *
 * queryName = The keyname you want to use to cache the data returned by your prisma query
 * queryPrisma = Your prisma query promise
 * expiration = Key expiration time in seconds, if you leave null the cached value will last forever
 *
 * Returns the data either from the redis cache, or from your query if the cache is not there.
 * caches the result from the query using the keyname provided.
 */
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
const redis_1 = __importDefault(require("./redis"));
exports.default = (queryName, queryPrisma, expiration = undefined) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const getQ = yield redis_1.default.get(`query-cache:${queryName}`);
        if (!getQ) {
            const data = yield queryPrisma;
            const dataJSON = JSON.stringify(data);
            if (!expiration) {
                yield redis_1.default.set(`query-cache:${queryName}`, dataJSON);
            }
            else {
                yield redis_1.default.set(`query-cache:${queryName}`, dataJSON, "EX", expiration);
            }
            return data;
        }
        else {
            return JSON.parse(getQ);
        }
    }
    catch (e) {
        throw new Error(e);
    }
});
