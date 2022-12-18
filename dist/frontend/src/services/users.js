"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.updateUser = exports.getUser = void 0;
const makeRequest_1 = require("./makeRequest");
const getUser = (uid) => (0, makeRequest_1.makeRequest)(`/api/users/${uid}`);
exports.getUser = getUser;
const updateUser = (data) => (0, makeRequest_1.makeRequest)(`/api/users`, {
    withCredentials: true,
    method: "POST",
    data,
});
exports.updateUser = updateUser;
const getProfile = (uid) => (0, makeRequest_1.makeRequest)(`/api/users/profile/${uid}`, { withCredentials: true });
exports.getProfile = getProfile;
const updateProfile = (data) => (0, makeRequest_1.makeRequest)(`/api/users/profile`, {
    method: "PUT",
    withCredentials: true,
    data,
});
exports.updateProfile = updateProfile;
