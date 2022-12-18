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
const formik_1 = require("formik");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const posts_1 = require("../services/posts");
const im_1 = require("react-icons/im");
const SocketContext_1 = require("../context/SocketContext");
const ProgressBar_1 = __importDefault(require("../components/ProgressBar"));
const ModalContext_1 = require("../context/ModalContext");
function Editor() {
    const { slug } = (0, react_router_dom_1.useParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { openModal } = (0, ModalContext_1.useModal)();
    const [resMsg, setResMsg] = (0, react_1.useState)({ err: false, pen: false, msg: "" });
    //The slug of the URL, except when uploading the post, not updating it
    const [slugTemp, setSlugTemp] = (0, react_1.useState)("");
    const formik = (0, formik_1.useFormik)({
        initialValues: {
            title: "",
            description: "",
            body: "",
            tags: "",
        },
        onSubmit: (values) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!file && !slug)
                    throw new Error("Provide a cover image");
                setResMsg({
                    msg: slug ? "Updating post" : "Creating post",
                    err: false,
                    pen: true,
                });
                const req = slug
                    ? (0, posts_1.updatePostData)(values, slug)
                    : (0, posts_1.uploadPostData)(values);
                const data = yield new Promise((resolve, reject) => req.then((data) => resolve(data)).catch((e) => reject));
                if (!slug)
                    setSlugTemp(data.slug);
                if (file) {
                    const imageReq = slug
                        ? (0, posts_1.updateCoverImage)(slug, file, file === null || file === void 0 ? void 0 : file.size)
                        : (0, posts_1.uploadCoverImage)(data.slug, file, file.size);
                    yield imageReq;
                }
                setResMsg({
                    msg: slug ? "Updated post" : "Created post",
                    err: false,
                    pen: false,
                });
            }
            catch (e) {
                setResMsg({ msg: `${e}`, err: true, pen: false });
            }
        }),
    });
    const { socket } = (0, SocketContext_1.useSocket)();
    const [progress, setProgress] = (0, react_1.useState)(0);
    const handleCoverImageAttachmentProgress = (0, react_1.useCallback)((progress, slug) => {
        if (slug === slugTemp)
            setProgress(progress);
    }, [slugTemp]);
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket === null || socket === void 0 ? void 0 : socket.on("post_cover_image_progress", handleCoverImageAttachmentProgress);
        return () => {
            socket === null || socket === void 0 ? void 0 : socket.off("post_cover_image_progress", handleCoverImageAttachmentProgress);
        };
    }, [socket]);
    const [imageKey, setImageKey] = (0, react_1.useState)("");
    const loadIntoEditor = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setResMsg({ msg: "Loading", err: false, pen: true });
            const post = yield (0, posts_1.getPost)(String(slug));
            setImageKey(post.imageKey);
            formik.setFieldValue("title", post.title);
            formik.setFieldValue("description", post.description);
            formik.setFieldValue("body", post.body);
            formik.setFieldValue("tags", "#" + post.tags.join("#"));
            setResMsg({ msg: "", err: false, pen: false });
        }
        catch (e) {
            setResMsg({ msg: `${e}`, err: true, pen: false });
        }
    });
    (0, react_1.useEffect)(() => {
        if (slug)
            loadIntoEditor();
    }, [slug]);
    const [file, setFile] = (0, react_1.useState)();
    const hiddenCoverImageRef = (0, react_1.useRef)(null);
    const handleImage = (e) => __awaiter(this, void 0, void 0, function* () {
        if (!e.target.files)
            return;
        const file = e.target.files[0];
        if (!file)
            return;
        setFile(file);
    });
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: !resMsg.pen ? ((0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: formik.handleSubmit, className: "w-full flex flex-col gap-2 p-2" }, { children: [(0, jsx_runtime_1.jsx)("label", Object.assign({ className: "mx-auto font-bold text-md", htmlFor: "title" }, { children: "Title" })), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "text-center", id: "title", name: "title", onChange: formik.handleChange, value: formik.values.title }), (0, jsx_runtime_1.jsx)("label", Object.assign({ className: "mx-auto font-bold text-md", htmlFor: "description" }, { children: "Description" })), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "text-center", id: "description", name: "description", onChange: formik.handleChange, value: formik.values.description }), (0, jsx_runtime_1.jsx)("label", Object.assign({ className: "mx-auto font-bold text-md", htmlFor: "tags" }, { children: "Tags" })), (0, jsx_runtime_1.jsx)("input", { className: "text-center", id: "tags", name: "tags", onChange: formik.handleChange, value: formik.values.tags }), (0, jsx_runtime_1.jsx)("label", Object.assign({ className: "mx-auto font-bold text-md", htmlFor: "body" }, { children: "Body" })), (0, jsx_runtime_1.jsx)("textarea", { className: "text-center h-60", id: "body", name: "body", onChange: formik.handleChange, value: formik.values.body }), (0, jsx_runtime_1.jsx)("button", Object.assign({ type: "button", onClick: () => { var _a; return (_a = hiddenCoverImageRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, "aria-label": "Select cover image" }, { children: "Select cover image" })), (0, jsx_runtime_1.jsx)("input", { ref: hiddenCoverImageRef, onChange: handleImage, type: "file", className: "hidden" }), (0, jsx_runtime_1.jsx)("button", Object.assign({ type: "submit", "aria-label": slug ? "Update post" : "Create post" }, { children: slug ? "Update post" : "Create post" })), slug && ((0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => {
                        openModal("Confirm", {
                            pen: false,
                            err: false,
                            msg: "Are you sure you want to delete this post?",
                            confirmationCallback: () => {
                                navigate("/blog/1");
                                openModal("Message", {
                                    err: false,
                                    pen: true,
                                    msg: "Deleting post...",
                                });
                                (0, posts_1.deletePost)(slug)
                                    .then(() => {
                                    openModal("Message", {
                                        err: false,
                                        pen: false,
                                        msg: "Deleted post",
                                    });
                                })
                                    .catch((e) => {
                                    openModal("Message", {
                                        err: true,
                                        pen: false,
                                        msg: `${e}`,
                                    });
                                });
                            },
                        });
                    }, type: "button", "aria-label": "Delete post" }, { children: "Delete post" }))), file && ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("img", { className: "shadow rounded mb-2 mx-auto", src: URL.createObjectURL(file) }) })), !file && imageKey && slug && ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("img", { className: "shadow rounded mb-2 mx-auto", src: `https://d2gt89ey9qb5n6.cloudfront.net/${imageKey}` }) })), progress !== 0 && progress !== 1 && ((0, jsx_runtime_1.jsx)(ProgressBar_1.default, { percent: progress * 100 }))] }))) : ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "my-10 drop-shadow" }, { children: [(0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "animate-spin text-4xl mx-auto" }), progress !== 0 && progress !== 1 && ((0, jsx_runtime_1.jsx)(ProgressBar_1.default, { percent: progress * 100 })), (0, jsx_runtime_1.jsx)("p", Object.assign({ className: "text-center text-lg font-bold" }, { children: resMsg.msg }))] }))) }));
}
exports.default = Editor;
