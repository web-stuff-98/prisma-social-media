"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModal = exports.ModalProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const im_1 = require("react-icons/im");
const bi_1 = require("react-icons/bi");
const ModalContext = (0, react_1.createContext)({
    openModal: () => { },
    closeModal: () => { },
    setData: () => { },
});
/**
 *
 * modalType can be either "Confirm", "Message"
 *
 * modalData :
 *  pen = something is pending / loading
 *  err = message is an error
 *  msg = message content
 *  confirmationCallback = the asynchronous promise invoked after confirmation
 *  cancellationCallback = your cancellation function
 *
 * "Message" modal type have an error, a loading spinner
 * or just a message on its own.
 *
 */
const ModalProvider = ({ children }) => {
    const [modalType, setModalType] = (0, react_1.useState)("Message");
    const [modalData, setModalData] = (0, react_1.useState)(defaultModalData);
    const [showModal, setShowModal] = (0, react_1.useState)(false);
    const openModal = (modalType, modalData) => {
        console.log("OPEN MODAL");
        setModalData((old) => (Object.assign(Object.assign({}, old), modalData)));
        setShowModal(true);
        setModalType(modalType);
    };
    const closeModal = () => {
        setShowModal(false);
    };
    const setData = (data) => setModalData((old) => (Object.assign(Object.assign({}, old), data)));
    return ((0, jsx_runtime_1.jsxs)(ModalContext.Provider, Object.assign({ value: { openModal, closeModal, setData } }, { children: [(0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: showModal && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: modalBackdropStyle }), (0, jsx_runtime_1.jsx)("div", Object.assign({ onClick: () => {
                                if (!modalData.pen)
                                    closeModal();
                            }, style: modalContainerStyle }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: modalStyle, className: "rounded-sm bg-foreground dark:text-white dark:border-stone-800 border dark:bg-darkmodeForeground font-rubik p-3 drop-shadow bg-gray-100 flex flex-col" }, { children: [showModal && modalType === "Confirm" && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("b", Object.assign({ className: "text-center leading-5 pb-2" }, { children: modalData.msg })), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "w-full flex gap-2 items-center justify-center" }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": "Cancel", onClick: () => {
                                                            if (modalData.cancellationCallback)
                                                                modalData.cancellationCallback();
                                                            closeModal();
                                                        } }, { children: "Cancel" })), (0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": "Confirm", onClick: () => {
                                                            if (modalData.confirmationCallback)
                                                                modalData.confirmationCallback();
                                                            closeModal();
                                                        } }, { children: "Confirm" }))] }))] })), showModal && modalType === "Message" && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [modalData.pen && ((0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "mx-auto text-3xl mb-2 drop-shadow animate-spin " })), modalData.err && ((0, jsx_runtime_1.jsx)(bi_1.BiError, { className: "mx-auto text-3xl mb-2 drop-shadow" })), (0, jsx_runtime_1.jsx)("b", Object.assign({ className: "text-center leading-5" }, { children: modalData.msg }))] }))] })) }))] })) }), children] })));
};
exports.ModalProvider = ModalProvider;
const useModal = () => (0, react_1.useContext)(ModalContext);
exports.useModal = useModal;
const defaultModalData = {
    msg: "Hello",
    err: false,
    pen: false,
    confirmationCallback: () => { },
    cancellationCallback: () => { },
};
const modalBackdropStyle = {
    width: "100vw",
    height: "100vh",
    position: "fixed",
    left: "0",
    top: "0",
    background: "radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.166) 100%)",
    backdropFilter: "blur(1.5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "99"
};
const modalStyle = {
    width: "fit-content",
    maxWidth: "min(20pc, 95vw)",
    zIndex: "100"
};
const modalContainerStyle = {
    position: "fixed",
    left: "0",
    top: "0",
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    zIndex: "100",
    justifyContent: "center",
};
