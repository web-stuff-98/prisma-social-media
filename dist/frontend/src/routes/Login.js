"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const formik_1 = require("formik");
const AuthContext_1 = require("../context/AuthContext");
function Login() {
    const { login } = (0, AuthContext_1.useAuth)();
    const formik = (0, formik_1.useFormik)({
        initialValues: {
            username: "",
            password: "",
        },
        onSubmit: (values) => login(values.username, values.password),
    });
    return ((0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: formik.handleSubmit, className: "flex flex-col items-center justify-center gap-2 p-2 text-center" }, { children: [(0, jsx_runtime_1.jsx)("label", Object.assign({ htmlFor: "username" }, { children: "Username" })), (0, jsx_runtime_1.jsx)("input", { value: formik.values.username, onChange: formik.handleChange, name: "username", id: "username", type: "text", required: true, className: "text-center" }), (0, jsx_runtime_1.jsx)("label", Object.assign({ htmlFor: "password" }, { children: "Password" })), (0, jsx_runtime_1.jsx)("input", { value: formik.values.password, onChange: formik.handleChange, name: "password", id: "password", type: "text", required: true, className: "text-center" }), (0, jsx_runtime_1.jsx)("button", Object.assign({ type: "submit", className: "w-full mt-2 py-1" }, { children: "Login" }))] })));
}
exports.default = Login;
