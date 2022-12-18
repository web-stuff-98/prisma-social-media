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
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("react");
const UsersContext_1 = __importDefault(require("../context/UsersContext"));
const User_1 = __importDefault(require("../components/User"));
const AuthContext_1 = require("../context/AuthContext");
const users_1 = require("../services/users");
const SocketContext_1 = require("../context/SocketContext");
const im_1 = require("react-icons/im");
function Profile() {
    const { id } = (0, react_router_dom_1.useParams)();
    const { cacheUserData, getUserData } = (0, UsersContext_1.default)();
    const { user: currentUser } = (0, AuthContext_1.useAuth)();
    const { socket } = (0, SocketContext_1.useSocket)();
    const backgroundImageInputRef = (0, react_1.useRef)(null);
    const [bioInput, setBioInput] = (0, react_1.useState)("");
    const [backgroundBase64Input, setBackgroundBase64Input] = (0, react_1.useState)("");
    const [resMsg, setResMsg] = (0, react_1.useState)({ msg: "", err: false, pen: false });
    const [profileData, setProfileData] = (0, react_1.useState)(undefined);
    (0, react_1.useEffect)(() => {
        if (id)
            cacheUserData(id);
        else
            return;
        if (socket && id !== currentUser.id)
            socket === null || socket === void 0 ? void 0 : socket.emit("open_profile", id);
        setResMsg({ msg: "", err: false, pen: true });
        (0, users_1.getProfile)(id)
            .then((profileData) => {
            setResMsg({ msg: "", err: false, pen: false });
            setProfileData(profileData);
            setBioInput(profileData.bio);
        })
            .catch((e) => {
            const msg = `${e}`;
            if (msg !== "You have no profile")
                setResMsg({ msg, err: true, pen: false });
            else
                setResMsg({ msg: "", err: false, pen: false });
        });
        return () => {
            socket === null || socket === void 0 ? void 0 : socket.emit("close_profile", id);
        };
    }, [id]);
    const renderWithUserData = (user) => {
        return ((0, jsx_runtime_1.jsx)("div", Object.assign({ style: (profileData === null || profileData === void 0 ? void 0 : profileData.backgroundBase64)
                ? {
                    backgroundImage: `url(${profileData === null || profileData === void 0 ? void 0 : profileData.backgroundBase64})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }
                : {}, className: "mb-2 py-2 px-4 rounded" }, { children: user ? ((0, jsx_runtime_1.jsx)(User_1.default, { style: Object.assign({}, ((profileData === null || profileData === void 0 ? void 0 : profileData.backgroundBase64)
                    ? {
                        backdropFilter: "blur(1px)",
                        padding: "0.25rem",
                        borderRadius: "0.5rem",
                        textShadow: "1px 2px 2px black",
                        border: "1px solid rgba(255,255,255,0.333)",
                        background: "rgba(0,0,0,0.1666)",
                        color: "white",
                        width: "fit-content",
                        margin: "auto",
                    }
                    : {
                        width: "fit-content",
                        margin: "auto",
                    })), uid: id, date: user.createdAt ? new Date(user.createdAt) : undefined, user: getUserData(`${id}`) })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {})) })));
    };
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        try {
            setResMsg({ msg: "", err: false, pen: true });
            yield (0, users_1.updateProfile)({
                bio: bioInput,
                backgroundBase64: backgroundBase64Input,
            });
            setResMsg({ msg: "", err: false, pen: false });
        }
        catch (e) {
            setResMsg({ msg: `${e}`, err: true, pen: false });
        }
    });
    const handleProfileUpdate = (0, react_1.useCallback)((data) => {
        setProfileData((old) => (Object.assign(Object.assign({}, old), data)));
    }, []);
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on("profile_update", handleProfileUpdate);
        return () => {
            socket.off("profile_update", handleProfileUpdate);
        };
    }, [socket]);
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "p-1 flex flex-col" }, { children: [!currentUser ||
                (id !== currentUser.id && renderWithUserData(getUserData(String(id)))), currentUser && currentUser.id === id && ((0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: handleSubmit, className: "flex flex-col w-full items-center justify-center gap-1" }, { children: [(0, jsx_runtime_1.jsx)("textarea", { placeholder: "Your bio...", "aria-label": "Your bio...", value: bioInput, className: "grow w-full", onChange: (e) => setBioInput(e.target.value) }), (0, jsx_runtime_1.jsx)("input", { ref: backgroundImageInputRef, onChange: (e) => {
                            const fr = new FileReader();
                            const file = e.target.files[0];
                            if (!file)
                                return;
                            fr.readAsDataURL(file);
                            fr.onloadend = () => setBackgroundBase64Input(`${fr.result}`);
                        }, type: "file", accept: ".jpg,.jpeg,.avif,.png,.heic", className: "hidden" }), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => { var _a; return (_a = backgroundImageInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: "w-full", type: "button", "aria-label": "Select background image" }, { children: "Select background image" })), (0, jsx_runtime_1.jsx)("button", Object.assign({ className: "w-full", type: "submit", "aria-label": "Update profile" }, { children: "Update profile" }))] }))), (backgroundBase64Input ||
                ((profileData === null || profileData === void 0 ? void 0 : profileData.backgroundBase64) &&
                    currentUser &&
                    currentUser.id === id)) && ((0, jsx_runtime_1.jsx)("img", { className: "rounded mt-1 shadow", src: `${backgroundBase64Input || (profileData === null || profileData === void 0 ? void 0 : profileData.backgroundBase64)}` })), !currentUser || (currentUser.id !== id && (0, jsx_runtime_1.jsx)("p", { children: profileData === null || profileData === void 0 ? void 0 : profileData.bio })), resMsg.pen ||
                (resMsg.msg && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "drop-shadow" }, { children: [resMsg.pen && ((0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "animate-spin text-4xl mx-auto" })), resMsg.msg && ((0, jsx_runtime_1.jsx)("p", Object.assign({ className: "text-center text-lg font-bold" }, { children: resMsg.msg })))] }))))] })));
}
exports.default = Profile;
