import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import useUsers from "../context/UsersContext";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { updatePfp } from "../services/users";

import { RiSettings4Fill } from "react-icons/ri";
import { useModal } from "../context/ModalContext";
import ProtectedRoute from "./ProtectedRoute";

export default function Settings() {
  const { user } = useAuth();
  const { getUserData, cacheUserData } = useUsers();
  const { openModal } = useModal();

  useEffect(() => {
    cacheUserData(String(user?.id));
  }, []);

  const [base64, setBase64] = useState("");

  const handlePfpInput = (e: ChangeEvent<HTMLInputElement>) => {
    let file: File;
    if (e.target.files && e.target.files.length > 0) file = e.target.files[0];
    else return;
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
          updatePfp(file)
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

  const hiddenPfpInput = useRef<HTMLInputElement>(null);
  return (
    <ProtectedRoute user={user}>
      <div style={{ maxWidth: "15pc" }} className="w-full flex flex-col">
        <div className="flex gap-2 items-center justify-center text-center">
          <RiSettings4Fill className="text-3xl" />
          <h1 className="text-center py-2 font-extrabold">Settings</h1>
        </div>
        <input
          type="file"
          className="hidden"
          onChange={handlePfpInput}
          ref={hiddenPfpInput}
        />
        {user && (
          <User
            pfpCursor={true}
            overridePfpOnClick={() => hiddenPfpInput.current?.click()}
            overridePfpBase64={base64}
            uid={String(user?.id)}
            user={getUserData(String(user?.id))}
          />
        )}
        <p className="text-center text-xs leading-3 mt-1 p-2">
          Click on your profile picture to select a new one, it will be updated
          as soon as you have confirmed the selection. There is a file size
          limit of around 4mb.
        </p>
      </div>
    </ProtectedRoute>
  );
}
