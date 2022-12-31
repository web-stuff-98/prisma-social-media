import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import useUsers from "../context/UsersContext";
import User from "../components/User";
import { IUser, useAuth } from "../context/AuthContext";
import {
  getProfile,
  updateProfile,
  updateProfileImage,
} from "../services/users";
import { useSocket } from "../context/SocketContext";
import { ImSpinner8 } from "react-icons/im";
import { IPost, usePosts } from "../context/PostsContext";
import PostCardShare from "../components/postList/PostCardShare";

type ProfileData = {
  backgroundBase64: string;
  bio: string;
};

export default function Profile() {
  const { id } = useParams();
  const { cacheUserData, getUserData } = useUsers();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const { sharesPosts, setSharesPosts, getPostData } = usePosts();

  const backgroundImageInputRef = useRef<HTMLInputElement>(null);

  const [bioInput, setBioInput] = useState("");
  const [backgroundImageFile, setBackgroundImageFile] = useState<File>();
  const backgroundImageFileRef = useRef<File>();

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });
  const [profileData, setProfileData] = useState<ProfileData | undefined>(
    undefined
  );

  useEffect(() => {
    if (id) cacheUserData(id);
    else return;
    if (socket && id !== currentUser!.id) socket?.emit("open_profile", id);
    setResMsg({ msg: "", err: false, pen: true });
    getProfile(id)
      .then(({ profileData, shares }) => {
        setResMsg({ msg: "", err: false, pen: false });
        setProfileData(profileData);
        setBioInput(profileData.bio);
        setSharesPosts(shares);
      })
      .catch((e) => {
        const msg = `${e}`;
        if (msg !== "You have no profile")
          setResMsg({ msg, err: true, pen: false });
        else setResMsg({ msg: "", err: false, pen: false });
      });
    return () => {
      socket?.emit("close_profile", id);
    };
  }, [id]);

  const renderWithUserData = (user?: IUser) => {
    return (
      <div
        style={
          profileData?.backgroundBase64
            ? {
                backgroundImage: `url(${profileData?.backgroundBase64})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
        className="mb-2 py-2 px-4 rounded"
      >
        {user ? (
          <User
            style={{
              ...(profileData?.backgroundBase64
                ? {
                    textShadow: "1px 2px 3px black",
                    filter: "drop-shadow(0px 1px 4px black)",
                    color: "white",
                    width: "fit-content",
                    margin: "auto",
                  }
                : {
                    width: "fit-content",
                    margin: "auto",
                  }),
            }}
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setResMsg({ msg: "", err: false, pen: true });
      if (bioInput) await updateProfile(bioInput);
      if (backgroundImageFileRef.current)
        await updateProfileImage(backgroundImageFileRef.current);
      setResMsg({ msg: "", err: false, pen: false });
    } catch (e) {
      setResMsg({ msg: `${e}`, err: true, pen: false });
    }
  };

  const handleProfileUpdate = useCallback((data: Partial<ProfileData>) => {
    setProfileData((old: any) => ({ ...old, ...data }));
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("profile_update", handleProfileUpdate);
    return () => {
      socket.off("profile_update", handleProfileUpdate);
    };
  }, [socket]);

  return (
    <div className="p-1 flex flex-col">
      {(backgroundImageFile ||
        (profileData?.backgroundBase64 &&
          currentUser &&
          currentUser.id === id)) && (
        <img
          className="rounded mb-1 shadow"
          src={`${
            backgroundImageFile
              ? URL.createObjectURL(backgroundImageFile)
              : profileData?.backgroundBase64
          }`}
        />
      )}
      {sharesPosts && (
        <>
          <h3 className="text-center text-md">Shares</h3>
          <div
            style={{ maxHeight: "15rem", height: "15rem" }}
            className="overflow-y-auto flex w-20 flex-col mb-2 gap-2"
          >
            {sharesPosts.map((p) => (
              <PostCardShare key={p} slug={p} />
            ))}
          </div>
        </>
      )}
      {(!currentUser || id !== currentUser.id) &&
        renderWithUserData(getUserData(String(id)))}
      {currentUser && currentUser.id === id && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full items-center justify-center gap-1"
        >
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
              const file = e.target.files![0];
              if (!file) return;
              setBackgroundImageFile(file);
              backgroundImageFileRef.current = file;
            }}
            type="file"
            accept=".jpg,.jpeg,.avif,.png,.heic"
            className="hidden"
          />
          <button
            onClick={() => backgroundImageInputRef.current?.click()}
            className="w-full"
            type="button"
            aria-label="Select background image"
          >
            Select background image
          </button>
          <button className="w-full" type="submit" aria-label="Update profile">
            Update profile
          </button>
        </form>
      )}
      {(!currentUser || currentUser.id !== id) && (
        <p className="text-center">{profileData?.bio}</p>
      )}
      {resMsg.pen ||
        (resMsg.msg && (
          <div className="drop-shadow">
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
