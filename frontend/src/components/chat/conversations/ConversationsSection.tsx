import { IconBtn } from "../../IconBtn";
import User from "../../User";

import { useState, useEffect } from "react";

import { RiDeleteBin4Fill, RiMessage2Fill } from "react-icons/ri";
import { getConversations, deleteConversation } from "../../../services/chat";
import { IUser } from "../../../context/AuthContext";
import { useChat } from "../../../context/ChatContext";
import useUsers from "../../../context/UsersContext";

export default function ConversationsSection() {
  const { openConversation } = useChat();
  const { getUserData } = useUsers();

  const [users, setUsers] = useState<IUser[]>([]);

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });

  useEffect(() => {
    setResMsg({ msg: "", err: false, pen: true });
    getConversations()
      .then((users) => {
        setUsers(users);
        setResMsg({ msg: "", err: false, pen: false });
      })
      .catch((e) => {
        setResMsg({ msg: `${e}`, err: true, pen: false });
      });
  }, []);

  return (
    <div className="flex flex-col overflow-y-auto max-h-full w-full">
      {users.length > 0 ? (
        <>
          {users.map((user) => (
            <div
              key={user.id}
              className="p-2 w-full flex justify-between items-center"
            >
              <User
                uid={user.id}
                overridePfpOnClick={() => {
                  openConversation(user.id);
                }}
                user={getUserData(user.id)}
              />
              <div className="flex flex-col gap-2 cursor-pointer">
                <IconBtn
                  onClick={() => deleteConversation(user.id)}
                  aria-label="Delete conversation with user"
                  color="text-rose-600"
                  Icon={RiDeleteBin4Fill}
                />
                <IconBtn
                  onClick={() => openConversation(user.id)}
                  aria-label="Conversation with user"
                  Icon={RiMessage2Fill}
                />
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="text-center flex items-center text-xs w-full text-center h-full my-auto p-3">
          You have neither received nor sent any messages. Click on another users profile to send a message. You can find other users on the blog, or you can search for another user by going back and using the search user section. Click on the three bars icon above to head back to the main chat menu.
        </div>
      )}
    </div>
  );
}
