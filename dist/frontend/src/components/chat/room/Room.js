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
const react_1 = require("react");
const chat_1 = require("../../../services/chat");
const MessageList_1 = __importDefault(require("../messages/MessageList"));
const useCustomArrayAsync_1 = __importDefault(require("../../../hooks/useCustomArrayAsync"));
const ChatContext_1 = require("../../../context/ChatContext");
const SocketContext_1 = require("../../../context/SocketContext");
const MessengerError_1 = __importDefault(require("../MessengerError"));
const UsersContext_1 = __importDefault(require("../../../context/UsersContext"));
const Videos_1 = __importDefault(require("../video/Videos"));
const simple_peer_1 = __importDefault(require("simple-peer"));
const process = __importStar(require("process"));
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
function Room({ roomId }) {
    const { rooms, setTopText, userStream, initVideo, } = (0, ChatContext_1.useChat)();
    const { socket } = (0, SocketContext_1.useSocket)();
    const { getUserData, cacheUserData, users } = (0, UsersContext_1.default)();
    const getAuthorName = (userData) => (userData ? userData.name : "");
    const [err, setErr] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        const found = rooms.find((r) => r.id === roomId);
        if (found) {
            cacheUserData(found.authorId);
            setTopText(`${found === null || found === void 0 ? void 0 : found.name} - by ${getAuthorName(getUserData(found.authorId))}`);
        }
    }, [rooms, users]);
    const [messageInput, setMessageInput] = (0, react_1.useState)("");
    const handleMessageInput = (e) => setMessageInput(e.target.value);
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
    const handleMessageSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        try {
            yield (0, chat_1.sendRoomMessage)(messageInput, roomId, file ? true : false);
        }
        catch (e) {
            setErr(`${e}`);
        }
    });
    const { status, error, value: messages, setValueState: setMessages, } = (0, useCustomArrayAsync_1.default)(chat_1.getRoomMessages, [roomId], "room_message_update", "room_message_delete", "room_message", (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on("room_message_request_attachment_upload", handleUploadAttachment);
        socket.on("room_message_attachment_complete", handleAttachmentComplete);
        socket.on("room_message_attachment_failed", handleAttachmentFailed);
        socket.on("room_message_attachment_progress", handleAttachmentProgress);
        return () => {
            socket.off("room_message_attachment_complete", handleAttachmentComplete);
            socket.off("room_message_attachment_failed", handleAttachmentFailed);
            socket.off("room_message_attachment_progress", handleAttachmentProgress);
            socket.off("room_message_request_attachment_upload", handleUploadAttachment);
        };
    }, [socket]);
    const handleUploadAttachment = (0, react_1.useCallback)((id) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!fileRef.current)
                throw new Error("No file selected");
            yield (0, chat_1.uploadRoomMessageAttachment)(id, fileRef.current.size, fileRef.current).then(() => setFile(undefined));
        }
        catch (e) {
            setErr(`${e}`);
        }
    }), [file]);
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
    }, []);
    ///////////////////////////////////// Video chat stuff /////////////////////////////////////
    const peersRef = (0, react_1.useRef)([]);
    const [peers, setPeers] = (0, react_1.useState)([]);
    const [isStreaming, setIsStreaming] = (0, react_1.useState)(false);
    const handleVidChatClicked = () => __awaiter(this, void 0, void 0, function* () {
        initVideo()
            .then(() => {
            setIsStreaming(true);
            (0, chat_1.roomOpenVideoChat)(roomId).catch((e) => setErr(`${e}`));
        })
            .catch((e) => setErr(`${e}`));
    });
    const handleVidChatAllUsers = (0, react_1.useCallback)((ids) => {
        const peers = [];
        ids.forEach((ids) => {
            const peer = createPeer(ids.sid, String(socket === null || socket === void 0 ? void 0 : socket.id), userStream === null || userStream === void 0 ? void 0 : userStream.current);
            peersRef.current.push({
                peerSID: ids.sid,
                peerUID: ids.uid,
                peer,
            });
            peers.push({ peer, peerSID: ids.sid, peerUID: ids.uid });
        });
        setPeers(peers);
    }, []);
    const handleVidChatUserJoined = (0, react_1.useCallback)((signal, callerSid, callerUid) => {
        const peer = addPeer(signal, callerSid, userStream === null || userStream === void 0 ? void 0 : userStream.current);
        setPeers((peers) => [
            ...peers,
            { peer, peerSID: callerSid, peerUID: callerUid },
        ]);
        peersRef.current.push({
            peerSID: callerSid,
            peerUID: callerUid,
            peer,
        });
    }, []);
    const handleVidChatReceivingReturningSignal = (signal, sid) => {
        const item = peersRef.current.find((p) => p.peerSID === sid);
        setTimeout(() => {
            item === null || item === void 0 ? void 0 : item.peer.signal(signal);
        });
    };
    const handleVidChatUserLeft = (uid) => {
        const peerRef = peersRef.current.find((p) => p.peerUID === uid);
        peerRef === null || peerRef === void 0 ? void 0 : peerRef.peer.destroy();
        setPeers((peers) => peers.filter((p) => p.peerUID !== uid));
        peersRef.current = peersRef.current.filter((p) => p.peerUID !== uid);
    };
    const createPeer = (userToSignal, callerSid, stream) => {
        if (typeof stream === "undefined")
            console.warn("Media stream is undefined");
        const peer = new simple_peer_1.default({
            initiator: true,
            trickle: false,
            stream: stream,
            config: ICE_Config,
        });
        peer.on("signal", (signal) => {
            socket === null || socket === void 0 ? void 0 : socket.emit("room_video_chat_sending_signal", {
                userToSignal,
                callerSid,
                signal,
            });
        });
        return peer;
    };
    const addPeer = (incomingSignal, callerSid, stream) => {
        if (typeof stream === "undefined")
            console.warn("Media stream is undefined");
        const peer = new simple_peer_1.default({
            initiator: false,
            trickle: false,
            stream: stream,
            config: ICE_Config,
        });
        peer.on("signal", (signal) => {
            socket === null || socket === void 0 ? void 0 : socket.emit("room_video_chat_returning_signal", { signal, callerSid });
        });
        setTimeout(() => {
            peer.signal(incomingSignal);
        });
        return peer;
    };
    (0, react_1.useEffect)(() => {
        socket === null || socket === void 0 ? void 0 : socket.on("room_video_chat_all_users", handleVidChatAllUsers);
        socket === null || socket === void 0 ? void 0 : socket.on("room_video_chat_user_joined", handleVidChatUserJoined);
        socket === null || socket === void 0 ? void 0 : socket.on("room_video_chat_receiving_returned_signal", handleVidChatReceivingReturningSignal);
        socket === null || socket === void 0 ? void 0 : socket.on("room_video_chat_user_left", handleVidChatUserLeft);
        return () => {
            socket === null || socket === void 0 ? void 0 : socket.off("room_video_chat_all_users", handleVidChatAllUsers);
            socket === null || socket === void 0 ? void 0 : socket.off("room_video_chat_user_joined", handleVidChatUserJoined);
            socket === null || socket === void 0 ? void 0 : socket.off("room_video_chat_receiving_returned_signal", handleVidChatReceivingReturningSignal);
            socket === null || socket === void 0 ? void 0 : socket.off("room_video_chat_user_left", handleVidChatUserLeft);
            peersRef.current.forEach((p) => p.peer.destroy());
            (0, chat_1.leaveRoom)(roomId);
        };
    }, []);
    return ((0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(isStreaming || peers.length > 0) && (0, jsx_runtime_1.jsx)(Videos_1.default, { peersData: peers, windowSize: "1/4" }), (0, jsx_runtime_1.jsx)(MessageList_1.default, { roomId: roomId, messages: messages, error: error, status: status }), err && (0, jsx_runtime_1.jsx)(MessengerError_1.default, { closeError: () => setErr(""), err: err }), (0, jsx_runtime_1.jsx)(MessageForm_1.default, { handleVidChatIconClicked: handleVidChatClicked, handleMessageSubmit: handleMessageSubmit, messageInput: messageInput, handleFileInput: handleFileInput, handleMessageInput: handleMessageInput, file: file })] }) }));
}
exports.default = Room;
