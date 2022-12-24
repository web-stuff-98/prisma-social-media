import { useFormik } from "formik";
import { useState, useEffect, ChangeEvent, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  uploadPostData,
  getPost,
  updatePostData,
  uploadCoverImage,
  deletePost,
  updateCoverImage,
} from "../services/posts";
import { ImSpinner8 } from "react-icons/im";
import { useSocket } from "../context/SocketContext";
import ProgressBar from "../components/ProgressBar";
import { useModal } from "../context/ModalContext";

export default function Editor() {
  const { slug } = useParams();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const [resMsg, setResMsg] = useState({ err: false, pen: false, msg: "" });

  //The slug, truthiness determines if the editor is in an editing state
  const [slugTemp, setSlugTemp] = useState("");
  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      body: "",
      tags: "",
    },
    onSubmit: async (values: any) => {
      try {
        if (!file && !slug) throw new Error("Provide a cover image");
        setResMsg({
          msg: slug ? "Updating post" : "Creating post",
          err: false,
          pen: true,
        });
        const req = slug
          ? updatePostData(values, slug)
          : uploadPostData(values);
        const data = await new Promise<any>((resolve, reject) =>
          req.then((data) => resolve(data)).catch((e) => reject)
        );
        if (!slug) setSlugTemp(data.slug);
        if (file) {
          const imageReq = slug
            ? updateCoverImage(slug, file, file?.size)
            : uploadCoverImage(data.slug, file, file.size);
          await imageReq;
        }
        setResMsg({
          msg: slug ? "Updated post" : "Created post",
          err: false,
          pen: false,
        });
      } catch (e) {
        setResMsg({ msg: `${e}`, err: true, pen: false });
      }
    },
  });

  const { socket } = useSocket();

  const [progress, setProgress] = useState(0);
  const handleCoverImageAttachmentProgress = useCallback(
    (progress: number, slug: string) => {
      if (slug === slugTemp) setProgress(progress);
    },
    [slugTemp]
  );
  useEffect(() => {
    if (!socket) return;
    socket?.on("post_cover_image_progress", handleCoverImageAttachmentProgress);
    return () => {
      socket?.off(
        "post_cover_image_progress",
        handleCoverImageAttachmentProgress
      );
    };
  }, [socket]);

  const [imageKey, setImageKey] = useState("");
  const loadIntoEditor = async () => {
    try {
      setResMsg({ msg: "Loading", err: false, pen: true });
      const post = await getPost(String(slug));
      setImageKey(post.imageKey);
      formik.setFieldValue("title", post.title);
      formik.setFieldValue("description", post.description);
      formik.setFieldValue("body", post.body);
      formik.setFieldValue("tags", "#" + post.tags.join("#"));
      setResMsg({ msg: "", err: false, pen: false });
    } catch (e) {
      setResMsg({ msg: `${e}`, err: true, pen: false });
    }
  };

  useEffect(() => {
    if (slug) loadIntoEditor();
  }, [slug]);

  const [file, setFile] = useState<File>();
  const hiddenCoverImageRef = useRef<HTMLInputElement>(null);
  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
  };

  return (
    <>
      {!resMsg.pen ? (
        <form
          onSubmit={formik.handleSubmit}
          className="w-full flex flex-col gap-2 p-2"
        >
          <label className="mx-auto font-bold text-md" htmlFor="title">
            Title
          </label>
          <input
            type="text"
            className="text-center"
            id="title"
            name="title"
            onChange={formik.handleChange}
            value={formik.values.title}
          />
          <label className="mx-auto font-bold text-md" htmlFor="description">
            Description
          </label>
          <input
            type="text"
            className="text-center"
            id="description"
            name="description"
            onChange={formik.handleChange}
            value={formik.values.description}
          />
          <label className="mx-auto font-bold text-md" htmlFor="tags">
            Tags
          </label>
          <input
            className="text-center"
            id="tags"
            name="tags"
            onChange={formik.handleChange}
            value={formik.values.tags}
          />
          <label className="mx-auto font-bold text-md" htmlFor="body">
            Body
          </label>
          <textarea
            className="text-center h-60"
            id="body"
            name="body"
            onChange={formik.handleChange}
            value={formik.values.body}
          />
          <button
            type="button"
            onClick={() => hiddenCoverImageRef.current?.click()}
            aria-label="Select cover image"
          >
            Select cover image
          </button>
          <input
            ref={hiddenCoverImageRef}
            onChange={handleImage}
            type="file"
            className="hidden"
          />
          <button
            type="submit"
            aria-label={slug ? "Update post" : "Create post"}
          >
            {slug ? "Update post" : "Create post"}
          </button>
          {slug && (
            <button
              onClick={() => {
                openModal("Confirm", {
                  pen: false,
                  err: false,
                  msg: "Are you sure you want to delete this post?",
                  confirmationCallback: () => {
                    navigate("/blog/1");
                    openModal("Message", {
                      err: false,
                      pen: true,
                      msg: "Deleting post...",
                    });
                    deletePost(slug)
                      .then(() => {
                        openModal("Message", {
                          err: false,
                          pen: false,
                          msg: "Deleted post",
                        });
                      })
                      .catch((e) => {
                        openModal("Message", {
                          err: true,
                          pen: false,
                          msg: `${e}`,
                        });
                      });
                  },
                });
              }}
              type="button"
              aria-label="Delete post"
            >
              Delete post
            </button>
          )}
          {file && (
            <>
              <img
                className="shadow rounded mb-2 mx-auto"
                src={URL.createObjectURL(file)}
              />
            </>
          )}
          {!file && imageKey && slug && (
            <>
              <img
                className="shadow rounded mb-2 mx-auto"
                src={`https://d2gt89ey9qb5n6.cloudfront.net/${process.env.NODE_ENV !== "production" ? "dev." : "" + imageKey}`}
              />
            </>
          )}
          {progress !== 0 && progress !== 1 && (
            <ProgressBar percent={progress * 100} />
          )}
        </form>
      ) : (
        <div className="my-10 drop-shadow">
          <ImSpinner8 className="animate-spin text-4xl mx-auto" />
          {progress !== 0 && progress !== 1 && (
            <ProgressBar percent={progress * 100} />
          )}
          <p className="text-center text-lg font-bold">{resMsg.msg}</p>
        </div>
      )}
    </>
  );
}
