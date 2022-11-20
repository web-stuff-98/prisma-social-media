import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import useUsers from "../context/UsersContext";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { updateUser } from "../services/users";

import { RiSettings4Fill } from "react-icons/ri";
import { useModal } from "../context/ModalContext";

export default function Settings() {
  const { user } = useAuth();
  const { getUserData, cacheUserData } = useUsers();
  const { setData: setModalData } = useModal();

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });

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
    fr.onloadend = async () => {
      setResMsg({ msg: "", err: false, pen: true });
      setBase64(`${fr.result}`);
      try {
        await updateUser({ pfp: `${fr.result}` });
        setResMsg({ msg: "", err: false, pen: false });
      } catch (e) {
        setResMsg({ msg: `${e}`, err: true, pen: false });
      }
    };
  };

  const hiddenPfpInput = useRef<HTMLInputElement>(null);
  return (
    <div style={{maxWidth:"15pc"}} className="w-full flex flex-col">
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
      <p className="text-center text-xs leading-4 mt-1">
        Click on your profile picture to select a new one, then press confirm to
        update it.
      </p>
    </div>
  );
}
