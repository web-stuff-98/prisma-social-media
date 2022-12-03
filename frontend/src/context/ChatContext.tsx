import {
  useContext,
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode, CSSProperties } from "react";

import { BsFillChatRightFill } from "react-icons/bs";

import ChatTopIcons from "../components/chat/ChatTopTray";
import ConversationSection from "../components/chat/conversation/Conversation";
import ConversationsSection from "../components/chat/conversations/ConversationsSection";
import ChatMenu from "../components/chat/menu/ChatMenu";
import SearchUsers from "../components/chat/searchUsers/SearchUsers";
import UsersChatrooms from "../components/chat/rooms/usersChatrooms/UsersChatrooms";
import useScrollbarSize from "react-scrollbar-size";
import Rooms from "../components/chat/rooms/Rooms";
import Room from "../components/chat/room/Room";
import useCustomArrayAsync from "../hooks/useCustomArrayAsync";
import { getRooms } from "../services/chat";
import EditRoom from "../components/chat/editRoom/EditRoom";

export type ChatSection =
  | "Menu"
  | "SearchUsers"
  | "UsersChatrooms"
  | "Conversations"
  | "Conversation"
  | "Chatrooms"
  | "Chatroom"
  | "EditRoom";

export interface IMessage {
  id: string;
  message: string;
  senderId?: string; //if there is no senderId that means its a server message
  recipientId?: string; //recipientId doesn't actually exist for messages retrieved from getConversations (it might though now I'm not sure)
  hasAttachment: boolean;
  attachmentType?: string;
  attachmentKey?: string;
  attachmentPending?: boolean;
  attachmentError?: boolean;
  attachmentProgress?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  id: string;
  name: string;
  authorId: string;
  public: boolean;
  banned: { id: string }[];
  members: { id: string }[];
}

export type MessengerError = {
  msg: string;
  show: boolean;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { width: scrollBarWidth } = useScrollbarSize();

  const [topText, setTopText] = useState("");

  const [chatOpen, setchatOpen] = useState(false);
  const [chatSection, setChatSectionState] = useState<ChatSection>("Menu");
  const setChatSection = (to: ChatSection) => {
    setChatSectionState(to);
    if (to === "Menu") setTopText("");
  };

  const [conversationWith, setConversationWith] = useState("");
  const [roomId, setRoomId] = useState("");

  const openChat = () => {
    setChatSection("Menu");
    setchatOpen(true);
  };
  const closeChat = () => {
    setchatOpen(false);
    setChatSection("Menu");
  };
  const openConversation = (uid: string) => {
    setConversationWith(uid);
    setchatOpen(true);
    setChatSection("Conversation");
  };

  const [editRoomId, setEditRoomId] = useState("");
  const openRoomEditor = (roomId: string) => {
    setEditRoomId(roomId);
    setChatSection("EditRoom");
  };

  const {
    error: roomsError,
    status: roomsStatus,
    value: rooms,
  } = useCustomArrayAsync(
    getRooms,
    [],
    "room_updated",
    "room_deleted",
    "room_created"
  );

  const getRoom = useCallback(
    (id: string) => rooms.find((r) => r.id === id),
    [rooms]
  );

  return (
    <ChatContext.Provider
      value={{
        chatOpen,
        openChat,
        closeChat,
        openConversation,
        setChatSection,
        chatSection,
        topText,
        setTopText,
        rooms,
        roomsError,
        roomsStatus,
        roomId,
        setRoomId,
        openRoomEditor,
        editRoomId,
        getRoom,
      }}
    >
      <div
        style={{
          ...chatModalStyle,
          ...(chatOpen ? chatOpenStyle : chatClosedStyle),
          ...(chatSection === "Menu"
            ? { width: "fit-content", height: "fit-content" }
            : {}),
          right: `calc(${scrollBarWidth}px + 0.125rem)`,
          bottom: `calc(${scrollBarWidth}px + 0.125rem)`,
        }}
        className={`mx-auto font-rubik dark:text-white relative ${
          chatOpen
            ? "bg-foreground dark:bg-darkmodeForeground border border-zinc-300 dark:border-stone-800"
            : "bg-transparent"
        } rounded p-3 ${chatOpen ? "shadow-md" : ""}`}
      >
        {/* close chat icon tray / open chat icon */}
        {chatOpen ? (
          <ChatTopIcons />
        ) : (
          <button
            className="px-0 text-3xl bg-transparent"
            aria-label="Open chat"
          >
            <BsFillChatRightFill
              onClick={() => openChat()}
              className="text-3xl cursor-pointer text-black dark:text-white drop-shadow"
            />
          </button>
        )}
        {chatOpen && (
          <>
            {/* Menu */}
            {chatSection === "Menu" && <ChatMenu />}
            {/* Search users */}
            {chatSection === "SearchUsers" && <SearchUsers />}
            {/* Users chatrooms */}
            {chatSection === "UsersChatrooms" && <UsersChatrooms />}
            {/* Conversation */}
            {chatSection === "Conversation" && (
              <ConversationSection conversationWith={conversationWith} />
            )}
            {/* Conversations */}
            {chatSection === "Conversations" && <ConversationsSection />}
            {/* Find & create rooms */}
            {chatSection === "Chatrooms" && <Rooms />}
            {/* Chatroom */}
            {chatSection === "Chatroom" && <Room roomId={roomId} />}
            {/* Edit room */}
            {chatSection === "EditRoom" && (
              <EditRoom room={getRoom(editRoomId)} />
            )}
          </>
        )}
        {/*<VideoChatWindow />*/}
      </div>
      {children}
    </ChatContext.Provider>
  );
};

const ChatContext = createContext<{
  chatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  openConversation: (uid: string) => void;
  setChatSection: (to: ChatSection) => void;
  chatSection: ChatSection;
  topText: string;
  setTopText: (to: string) => void;
  roomsStatus: "idle" | "pending" | "success" | "error";
  roomsError: unknown;
  rooms: IRoom[];
  roomId: string;
  setRoomId: (to: string) => void;
  openRoomEditor: (roomId: string) => void;
  editRoomId: string;
  getRoom: (id: string) => IRoom | undefined;
}>({
  chatOpen: false,
  openChat: () => {},
  closeChat: () => {},
  openConversation: () => {},
  setChatSection: () => {},
  chatSection: "Menu",
  topText: "",
  setTopText: () => {},
  roomsStatus: "idle",
  roomsError: null,
  rooms: [],
  roomId: "",
  setRoomId: () => {},
  openRoomEditor: () => {},
  editRoomId: "",
  getRoom: () => undefined,
});

export const useChat = () => useContext(ChatContext);

const chatModalStyle: CSSProperties = {
  zIndex: "99",
  position: "absolute",
  overflow: "hidden",
};

const chatOpenStyle: CSSProperties = {
  width: "min(22.5pc, calc(100vw - 1rem))",
  height: "min(fit-content, 30pc, calc(100vh - 1rem - 70rem))",
  padding: "0",
  paddingTop: "1.5rem",
};

const chatClosedStyle: CSSProperties = {
  width: "min(22.5pc, fit-content)",
  height: "min(30pc, fit-content)",
  bottom: "0",
  right: "0",
};
