"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const User_1 = __importDefault(require("../components/User"));
const AuthContext_1 = require("../context/AuthContext");
const UsersContext_1 = __importDefault(require("../context/UsersContext"));
const react_1 = require("react");
const users_1 = require("../services/users");
const ri_1 = require("react-icons/ri");
const ModalContext_1 = require("../context/ModalContext");
function Settings() {
    const { user } = (0, AuthContext_1.useAuth)();
    const { getUserData, cacheUserData } = (0, UsersContext_1.default)();
    const { openModal } = (0, ModalContext_1.useModal)();
    const [resMsg, setResMsg] = (0, react_1.useState)({ msg: "", err: false, pen: false });
    (0, react_1.useEffect)(() => {
        cacheUserData(String(user === null || user === void 0 ? void 0 : user.id));
    }, []);
    const [base64, setBase64] = (0, react_1.useState)("");
    const handlePfpInput = (e) => {
        let file;
        if (e.target.files && e.target.files.length > 0)
            file = e.target.files[0];
        else
            return;
        const fr = new FileReader();
        fr.readAsDataURL(file);
        fr.onloadend = () => {
            openModal("Confirm", {
                msg: `Are you sure you want to use ${file.name} as your profile picture?`,
                err: false,
                pen: false,
                confirmationCallback: () => {
                    openModal("Message", {
                        msg: "Updating profile picture...",
                        pen: true,
                        err: false,
                    });
                    (0, users_1.updateUser)({ pfp: `${fr.result}` })
                        .then(() => {
                        openModal("Message", {
                            msg: "Your profile picture has been updated.",
                            err: false,
                            pen: false,
                        });
                        setBase64(`${fr.result}`);
                    })
                        .catch((e) => {
                        openModal("Message", {
                            err: true,
                            pen: false,
                            msg: `Error updating profile picture : ${e}`,
                        });
                    });
                },
            });
        };
    };
    const hiddenPfpInput = (0, react_1.useRef)(null);
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { maxWidth: "15pc" }, className: "w-full flex flex-col" }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex gap-2 items-center justify-center text-center" }, { children: [(0, jsx_runtime_1.jsx)(ri_1.RiSettings4Fill, { className: "text-3xl" }), (0, jsx_runtime_1.jsx)("h1", Object.assign({ className: "text-center py-2 font-extrabold" }, { children: "Settings" }))] })), (0, jsx_runtime_1.jsx)("input", { type: "file", className: "hidden", onChange: handlePfpInput, ref: hiddenPfpInput }), user && ((0, jsx_runtime_1.jsx)(User_1.default, { pfpCursor: true, overridePfpOnClick: () => { var _a; return (_a = hiddenPfpInput.current) === null || _a === void 0 ? void 0 : _a.click(); }, overridePfpBase64: base64, uid: String(user === null || user === void 0 ? void 0 : user.id), user: getUserData(String(user === null || user === void 0 ? void 0 : user.id)) })), (0, jsx_runtime_1.jsx)("p", Object.assign({ className: "text-center text-xs leading-3 mt-1 p-2" }, { children: "Click on your profile picture to select a new one, it will be updated as soon as you have confirmed the selection. There is a file size limit of around 4mb." }))] })));
}
exports.default = Settings;
