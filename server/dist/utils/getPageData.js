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
const prisma_1 = __importDefault(require("./prisma"));
exports.default = (query, params, uid) => __awaiter(void 0, void 0, void 0, function* () {
    let clientQueryInput = {
        pageOffset: 0,
    };
    let rawTags = "";
    let rawTerm = "";
    if (query) {
        rawTags = query.rawTags;
        rawTerm = query.rawTerm;
        clientQueryInput = Object.assign({ pageOffset: Number(Math.max(Number(params === null || params === void 0 ? void 0 : params.page) - 1, 0) * 20) }, (rawTags
            ? {
                tags: rawTags
                    ? String(rawTags)
                        .toLowerCase()
                        .split(" ")
                        .filter((tag) => tag.trim() !== "")
                        .map((tag) => tag.replace(/[^\w-]+/g, ""))
                    : [],
            }
            : rawTerm
                ? {
                    term: String(rawTerm)
                        .toLowerCase()
                        .trim()
                        .replaceAll("+", " ")
                        .replace(/[^\w-]+/g, ""),
                }
                : {}));
    }
    /*
    Need to use type any because there is a typescript error caused by mode: "insensitive"
    for some reason
    */
    const where = rawTags
        ? {
            imagePending: false,
            tags: { some: { name: { in: clientQueryInput.tags } } },
        }
        : Object.assign({ imagePending: false }, (clientQueryInput.term
            ? {
                title: {
                    contains: clientQueryInput.term,
                    mode: "insensitive",
                },
            }
            : {}));
    const posts = yield prisma_1.default.post.findMany({
        where: Object.assign({}, where),
        select: {
            id: true,
            slug: true,
            title: true,
            createdAt: true,
            description: true,
            author: {
                select: {
                    id: true,
                },
            },
            likes: true,
            shares: true,
            tags: true,
            imageKey: true,
            blur: true,
        },
        orderBy: { createdAt: "desc" },
        skip: clientQueryInput.pageOffset,
        take: 10,
    });
    const feedQ_count = yield prisma_1.default.post.findMany({
        where: Object.assign({}, where),
        select: { id: true },
    });
    return {
        posts: posts.map((post) => {
            let likedByMe = false;
            let sharedByMe = false;
            likedByMe = post.likes.find((like) => like.userId === uid) ? true : false;
            sharedByMe = post.shares.find((share) => share.userId === uid)
                ? true
                : false;
            return Object.assign(Object.assign({}, post), { likes: post.likes.length, shares: post.shares.length, tags: post.tags.map((tag) => tag.name), likedByMe,
                sharedByMe });
        }),
        pageCount: posts.length,
        fullCount: feedQ_count.length,
        maxPage: Math.ceil(feedQ_count.length / 20),
    };
});
