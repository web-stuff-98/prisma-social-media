import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import useUsers from "../context/UsersContext";
import User from "../components/User";
import { IUser, useAuth } from "../context/AuthContext";
import { getProfile } from "../services/users";
import { ImSpinner8 } from "react-icons/im";

export default function Profile() {
  const { id } = useParams();
  const { cacheUserData, getUserData } = useUsers();
  const { user: currentUser } = useAuth();

  const backgroundImageInputRef = useRef<HTMLInputElement>(null);

  const [bioInput, setBioInput] = useState("");
  const [backgroundBase64Input, setBackgroundBase64Input] = useState("");

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });
  const [profileData, setProfileData] = useState<
    undefined | { backgroundBase64: string; bio: string }
  >(undefined);

  useEffect(() => {
    if (id) cacheUserData(id);
    else return;
    setResMsg({ msg: "", err: false, pen: true });
    getProfile(id)
      .then((profileData) => {
        setResMsg({ msg: "", err: false, pen: false });
        setProfileData(profileData);
        setBioInput(profileData.bio);
      })
      .catch((e) => {
        const msg = `${e}`;
        if (msg !== "You have no profile")
          setResMsg({ msg, err: true, pen: false });
        else setResMsg({ msg: "", err: false, pen: false });
      });
  }, [id]);

  const renderWithUserData = (user?: IUser) => {
    return (
      <div className="mb-2">
        {user ? (
          <User
            uid={id}
            date={user.createdAt ? new Date(user.createdAt) : undefined}
            user={getUserData(`${id}`)}
          />
        ) : (
          <></>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 flex flex-col">
      {!currentUser ||
        (id !== currentUser.id && renderWithUserData(getUserData(String(id))))}
      {currentUser && currentUser.id === id && (
        <form className="flex flex-col w-full items-center justify-center gap-2">
          <textarea
            placeholder="Your bio..."
            aria-label="Your bio..."
            value={bioInput}
            className="grow w-full"
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setBioInput(e.target.value)
            }
          />
          <input
            ref={backgroundImageInputRef}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const fr = new FileReader();
              const file = e.target.files![0];
              if (!file) return;
              fr.readAsDataURL(file);
              fr.onloadend = () => setBackgroundBase64Input(`${fr.result}`);
            }}
            type="file"
            accept=".jpg,.jpeg,.avif,.png,.heic"
            className="hidden"
          />
          <button
            onClick={() => backgroundImageInputRef.current?.click()}
            className="bg-rose-500 w-full"
            type="button"
            aria-label="Select background image"
          >
            Select background image
          </button>
          <button
            className="bg-rose-500 w-full"
            type="submit"
            aria-label="Update profile"
          >
            Update profile
          </button>
        </form>
      )}
      {(backgroundBase64Input || profileData?.backgroundBase64) && (
        <img
        className="rounded mt-2 shadow"
          src={`${backgroundBase64Input || profileData?.backgroundBase64}`}
        />
      )}
      {resMsg.pen ||
        (resMsg.msg && (
          <div className="drop-shadow my-2">
            {resMsg.pen && (
              <ImSpinner8 className="animate-spin text-4xl mx-auto" />
            )}
            {resMsg.msg && (
              <p className="text-center text-lg font-bold">{resMsg.msg}</p>
            )}
          </div>
        ))}
    </div>
  );
}
