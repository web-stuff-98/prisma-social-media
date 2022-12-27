"use strict";
/*
This doesn't include the comments because its for displaying posts in the feed, not for displaying post pages
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (posts, uid) => posts.map((post) => {
    let likedByMe = false;
    let sharedByMe = false;
    likedByMe = post.likes.find((like) => like.userId === uid) ? true : false;
    sharedByMe = post.shares.find((share) => share.userId === uid)
        ? true
        : false;
    let out = Object.assign(Object.assign({}, post), { likes: post.likes.length, shares: post.shares.length, tags: post.tags.map((tag) => tag.name), likedByMe,
        sharedByMe });
    out.commentCount = out._count.comments;
    delete out._count;
    return out;
});
