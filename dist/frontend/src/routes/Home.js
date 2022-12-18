"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
function Home() {
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "w-full h-full flex flex-col items-center text-center gap-3 p-3" }, { children: [(0, jsx_runtime_1.jsx)("h1", Object.assign({ className: "font-extrabold text-3xl leading-5 pt-4" }, { children: "Prisma-social-media" })), (0, jsx_runtime_1.jsx)("h2", Object.assign({ className: "text-md py-0 font-bold leading-5" }, { children: "By Jason" })), (0, jsx_runtime_1.jsx)("p", Object.assign({ className: "text-sm" }, { children: "Welcome. This is my new social media portfolio project. Its features are group video chat, video and filesharing, embedded comments, upload progress tracking, ratelimiting, image processing, customizable chatrooms, user interactions such as kicking and banning, private messaging and markdown blogging. Everything updates live using socket io." })), (0, jsx_runtime_1.jsx)("p", { children: "To access the user actions dropdown menu click on a users profile picture. From there you can invite the user to a chatroom, direct message them, view their profile, and kick them or ban them from a room. You can only access this menu when you are logged in. You can create an account with just a username and password, or log into one of the test accounts if you prefer. The password for the test accounts is \"Test1234!\". Once logged in you can also access chat by clicking on the icon in the bottom right end of the screen." }), (0, jsx_runtime_1.jsx)("p", { children: "The frontend was made using React, Typescript and TailwindCSS. The backend uses Express, Prisma, Typescript, Redis, Socket.io, Amazon RDS postgreSQL database and Amazon S3 storage bucket. API routes are protected by Yup, express-slow-down and my redis rate limiter middlewares. Live updates depend on component visibility and all the images are automatically processed to reduce filesize. Thumbnails are lazyloaded and a blur placeholder is generated for post cover images. Pagination and search are handled serverside." }), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "font-bold leading-4 text-md" }, { children: "If you want to test out the video chat you have to use a non chromium based browser like firefox. Chromium based browsers like chrome and microsoft edge will always deny access to the camera even after allowing permission." }))] })));
}
exports.default = Home;
