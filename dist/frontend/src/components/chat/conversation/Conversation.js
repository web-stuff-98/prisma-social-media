"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const MessageForm_1 = __importDefault(require("../messages/MessageForm"));
const useCustomArrayAsync_1 = __importDefault(require("../../../hooks/useCustomArrayAsync"));
const react_1 = require("react");
const chat_1 = require("../../../services/chat");
const SocketContext_1 = require("../../../context/SocketContext");
const ChatContext_1 = require("../../../context/ChatContext");
const MessageList_1 = __importDefault(require("../messages/MessageList"));
const MessengerError_1 = __importDefault(require("../MessengerError"));
const simple_peer_1 = __importDefault(require("simple-peer"));
const process = __importStar(require("process"));
const Videos_1 = __importDefault(require("../video/Videos"));
window.process = process;
const ICE_Config = {
    iceServers: [
        {
            urls: "stun:openrelay.metered.ca:80",
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ],
};
function ConversationSection({ conversationWith = "", }) {
    const { status, error, value: messages, setValueState: setMessages, } = (0, useCustomArrayAsync_1.default)(chat_1.getConversation, [conversationWith], "private_message_update", "private_message_delete", "private_message", (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const { socket } = (0, SocketContext_1.useSocket)();
    const { setChatSection, initVideo, userStream } = (0, ChatContext_1.useChat)();
    const [err, setErr] = (0, react_1.useState)("");
    const messagesBottomRef = (0, react_1.useRef)(null);
    const [messageInput, setMessageInput] = (0, react_1.useState)("");
    const handleMessageInput = (e) => setMessageInput(e.target.value);
    const handleMessageSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        try {
            yield (0, chat_1.sendPrivateMessage)(messageInput, conversationWith, file ? true : false);
        }
        catch (e) {
            setErr(`${e}`);
        }
    });
    const [file, setFile] = (0, react_1.useState)();
    const fileRef = (0, react_1.useRef)();
    const handleFileInput = (e) => {
        var _a, _b;
        if (((_a = e.target.files) === null || _a === void 0 ? void 0 : _a.length) === 0)
            return;
        const f = (_b = e.target) === null || _b === void 0 ? void 0 : _b.files[0];
        if (!f)
            return;
        setFile(f);
        fileRef.current = f;
    };
    (0, react_1.useEffect)(() => {
        var _a;
        if (!messages)
            return;
        (_a = messagesBottomRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "auto" });
    }, [messages]);
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on("private_message_request_attachment_upload", handleUploadAttachment);
        socket.emit("private_conversation_open", conversationWith);
        socket.on("private_conversation_deleted", handleConversationDeleted);
        socket.on("private_message_attachment_complete", handleAttachmentComplete);
        socket.on("private_message_attachment_failed", handleAttachmentFailed);
        socket.on("private_message_attachment_progress", handleAttachmentProgress);
        socket.on("private_conversation_video_chat_user", handleReceiveVideoCall);
        socket.on("private_conversation_video_chat_user_joined", handleVidChatUserJoined);
        socket.on("private_conversation_video_chat_receiving_returned_signal", handleVidChatReceivingReturningSignal);
        socket.on("private_conversation_video_chat_user_left", handleVidChatUserLeft);
        return () => {
            socket.off("private_message_attachment_complete", handleAttachmentComplete);
            socket.off("private_message_attachment_failed", handleAttachmentFailed);
            socket.off("private_message_attachment_progress", handleAttachmentProgress);
            socket.off("private_message_request_attachment_upload", handleUploadAttachment);
            socket.off("private_conversation_deleted", handleConversationDeleted);
            socket.off("private_conversation_video_chat_user", handleReceiveVideoCall);
            socket.off("private_conversation_video_chat_user_joined", handleVidChatUserJoined);
            socket.off("private_conversation_video_chat_receiving_returned_signal", handleVidChatReceivingReturningSignal);
            socket.off("private_conversation_video_chat_user_left", handleVidChatUserLeft);
            socket.emit("private_conversation_close");
        };
    }, [socket]);
    const handleUploadAttachment = (0, react_1.useCallback)((id) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!fileRef.current)
                throw new Error("No file selected");
            yield (0, chat_1.uploadPrivateMessageAttachment)(id, fileRef.current.size, fileRef.current).then(() => setFile(undefined));
        }
        catch (e) { }
    }), [file]);
    const handleConversationDeleted = (0, react_1.useCallback)((sender) => {
        if (conversationWith === sender) {
            setChatSection("Conversations");
        }
        setMessages((p) => [...p.filter((msg) => msg.senderId !== sender)]);
    }, []);
    const handleAttachmentComplete = (0, react_1.useCallback)((messageId, type, key) => {
        setMessages((p) => {
            let newMsgs = p;
            const i = newMsgs.findIndex((msg) => msg.id === messageId);
            if (!newMsgs[i] || !newMsgs[i].attachmentPending)
                return p;
            newMsgs[i] = Object.assign(Object.assign({}, newMsgs[i]), { hasAttachment: true, attachmentPending: false, attachmentType: type, attachmentKey: key, attachmentError: false });
            return [...newMsgs];
        });
    }, []);
    const handleAttachmentFailed = (0, react_1.useCallback)((messageId) => {
        setMessages((p) => {
            let newMsgs = p;
            const i = newMsgs.findIndex((msg) => msg.id === messageId);
            newMsgs[i] = Object.assign(Object.assign({}, newMsgs[i]), { attachmentPending: false, attachmentError: true });
            return [...newMsgs];
        });
    }, []);
    const handleAttachmentProgress = (0, react_1.useCallback)((progress, messageId) => {
        setMessages((p) => {
            let newMsgs = p;
            const i = newMsgs.findIndex((msg) => msg.id === messageId);
            newMsgs[i] = Object.assign(Object.assign({}, newMsgs[i]), { attachmentProgress: Math.max(0.05, progress) });
            return [...newMsgs];
        });
    }, [messages]);
    ///////////////////////////// Video chat stuff /////////////////////////////
    const peerRef = (0, react_1.useRef)();
    const [peer, setPeer] = (0, react_1.useState)();
    const [isStreaming, setIsStreaming] = (0, react_1.useState)(false);
    const handleVidChatClicked = () => {
        initVideo()
            .then(() => {
            setIsStreaming(true);
            (0, chat_1.conversationOpenVideoChat)(conversationWith).catch((e) => setErr(`${e}`));
        })
            .catch((e) => setErr(`${e}`));
    };
    const handleReceiveVideoCall = (0, react_1.useCallback)((sid) => {
        console.log("Received call from " + sid);
        const peer = createPeer(sid);
        peerRef.current = {
            peerSID: sid,
            peer,
        };
        setPeer({ peer, peerSID: sid });
    }, []);
    const handleVidChatUserJoined = (0, react_1.useCallback)((signal, callerSid) => {
        const peer = addPeer(signal, userStream === null || userStream === void 0 ? void 0 : userStream.current, callerSid);
        setPeer({ peer, peerSID: callerSid });
        peerRef.current = {
            peerSID: callerSid,
            peer,
        };
    }, []);
    const handleVidChatReceivingReturningSignal = (signal) => {
        setTimeout(() => {
            var _a;
            (_a = peerRef.current) === null || _a === void 0 ? void 0 : _a.peer.signal(signal);
        });
    };
    const handleVidChatUserLeft = () => {
        var _a;
        (_a = peerRef.current) === null || _a === void 0 ? void 0 : _a.peer.destroy();
        setPeer(undefined);
        peerRef.current = undefined;
    };
    const createPeer = (sid) => {
        if (typeof (userStream === null || userStream === void 0 ? void 0 : userStream.current) === "undefined")
            throw new Error("Media stream is undefined");
        const peer = new simple_peer_1.default({
            initiator: true,
            trickle: false,
            stream: userStream.current,
            config: ICE_Config,
        });
        peer.on("signal", (signal) => {
            socket === null || socket === void 0 ? void 0 : socket.emit("private_conversation_video_chat_sending_signal", {
                userToSignal: conversationWith,
                signal,
            });
        });
        return peer;
    };
    const addPeer = (incomingSignal, stream, callerSid) => {
        if (typeof stream === "undefined")
            throw new Error("Media stream is undefined");
        const peer = new simple_peer_1.default({
            initiator: false,
            trickle: false,
            stream,
            config: ICE_Config,
        });
        peer.on("signal", (signal) => {
            socket === null || socket === void 0 ? void 0 : socket.emit("private_conversation_video_chat_returning_signal", {
                signal,
                callerSid,
            });
        });
        setTimeout(() => {
            peer.signal(incomingSignal);
        });
        return peer;
    };
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "w-full h-full flex flex-col items-between justify-between" }, { children: [(isStreaming || peer) && ((0, jsx_runtime_1.jsx)(Videos_1.default, { windowSize: "1/2", peersData: peer ? [Object.assign(Object.assign({}, peer), { peerUID: conversationWith })] : [] })), (0, jsx_runtime_1.jsx)(MessageList_1.default, { messages: messages, status: status, error: error }), err && (0, jsx_runtime_1.jsx)(MessengerError_1.default, { err: err, closeError: () => setErr("") }), (0, jsx_runtime_1.jsx)(MessageForm_1.default, { file: file, handleFileInput: handleFileInput, handleMessageInput: handleMessageInput, handleMessageSubmit: handleMessageSubmit, messageInput: messageInput, handleVidChatIconClicked: handleVidChatClicked })] })));
}
exports.default = ConversationSection;
