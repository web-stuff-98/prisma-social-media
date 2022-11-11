import {
  useContext,
  createContext,
  useState,
  ReactNode,
  CSSProperties,
  ChangeEvent,
  FormEvent,
} from "react";

import { BsFillChatRightFill } from "react-icons/bs";

import MessengerTopIcons from "../components/MessengerTopIcons";
import Message from "../components/messenger/Message";
import MessageForm from "../components/messenger/MessageForm";

/**
 * messengerSection = Conversation || Converations
 */

export const MessengerProvider = ({ children }: { children: ReactNode }) => {
  const [messengerOpen, setMessengerOpen] = useState(false);

  const openMessenger = () => {
    setMessengerSection("Conversation");
    setMessengerOpen(true);
  };
  const closeMessenger = () => {
    setMessengerOpen(false);
  };
  const [messengerSection, setMessengerSection] = useState("Conversation");

  const [messageInput, setMessageInput] = useState("");
  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };
  const handleMessageSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <MessengerContext.Provider
      value={{ messengerOpen, openMessenger, closeMessenger }}
    >
      <div
        style={{
          ...messengerModalStyle,
          ...(messengerOpen ? messengerOpenStyle : messengerClosedStyle),
        }}
        className={`mx-auto ${
          messengerOpen ? "bg-white border" : "bg-transparent"
        } rounded-sm p-3 drop-shadow`}
      >
        {/* close messenger icon tray / open messenger icon */}
        {messengerOpen ? (
          <MessengerTopIcons />
        ) : (
          <button className="px-0 bg-transparent" aria-label="Open messenger">
            <BsFillChatRightFill
              onClick={() => openMessenger()}
              className="text-3xl cursor-pointer text-black drop-shadow"
            />
          </button>
        )}
        {messengerOpen && (
          <>
            {/* Conversation */}
            {messengerSection === "Conversation" && (
              <div className="w-full h-full flex flex-col items-between justify-between">
                <div className="grow overflow-y-scroll">
                  <Message />
                  <Message otherUser />
                  <Message
                    attachmentData={{
                      type: "Video",
                      url: "https://www.youtube.com/watch?v=o5q2Louzwxg",
                    }}
                  />
                  <Message
                    otherUser
                    attachmentData={{
                      type: "Image",
                      url: "https://images.unsplash.com/photo-1667615983516-5e724e6fc348?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwyfHx8ZW58MHx8fHw%3D&auto=format&fit=crop&w=500&q=60",
                    }}
                  />
                </div>
                <MessageForm
                  handleMessageInput={(e) => {}}
                  handleMessageSubmit={(e) => {}}
                  messageInput={""}
                />
              </div>
            )}

            {/* Conversations */}
            {messengerSection === "Conversations" && <>Conversations</>}
          </>
        )}
      </div>
      {children}
    </MessengerContext.Provider>
  );
};

const MessengerContext = createContext<{
  messengerOpen: boolean;
  openMessenger: () => void;
  closeMessenger: () => void;
}>({
  messengerOpen: false,
  openMessenger: () => {},
  closeMessenger: () => {},
});
export const useMessenger = () => useContext(MessengerContext);

const messengerModalStyle: CSSProperties = {
  zIndex: "100",
  position: "absolute",
  bottom: "1.25rem",
  right: "1.25rem",
  overflow: "hidden",
};

const messengerOpenStyle: CSSProperties = {
  width: "min(22.5pc, calc(100vw - 1rem))",
  height: "min(30pc, calc(100vh - 1rem))",
  padding: "0",
  paddingTop: "1.5rem",
};

const messengerClosedStyle: CSSProperties = {
  width: "fit-content",
  height: "fit-content",
  bottom: "0",
  right: "0",
};
