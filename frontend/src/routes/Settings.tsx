import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import useUsers from "../context/UsersContext";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { updateUser } from "../services/users";

export default function Settings() {
  const { user } = useAuth();
  const { getUserData, cacheUserData } = useUsers();

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
    <>
      <h1 className="text-center mt-6 py-2">Settings</h1>
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
      <p className="text-center">Click on your profile picture to update it</p>
    </>
  );
}
