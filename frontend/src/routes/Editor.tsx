import { useFormik } from "formik";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useParams } from "react-router-dom";

import { createPost, getPost, updatePost } from "../services/posts";
import { ImSpinner8 } from "react-icons/im";

export default function Editor() {
  const { slug } = useParams();

  const [resMsg, setResMsg] = useState({ err: false, pen: false, msg: "" });

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      body: "",
      tags: "",
      base64coverImage: "",
    },
    onSubmit: async (values: any) => {
      try {
        setResMsg({
          msg: slug ? "Updating post" : "Creating post",
          err: false,
          pen: true,
        });
        slug ? await updatePost(values, slug) : await createPost(values);
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

  const loadIntoEditor = async () => {
    try {
      setResMsg({ msg: "Loading", err: false, pen: true });
      const post = await getPost(String(slug));
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

  const hiddenCoverImageRef = useRef<HTMLInputElement>(null);
  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fileBase64 = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.readAsDataURL(file);
        fr.onloadend = () => resolve(fr.result);
        fr.onerror = () => reject("Error reading file");
        fr.onabort = () => reject("File reader aborted");
      });
      formik.setFieldValue("base64coverImage", fileBase64);
    } catch (e: unknown) {
      setResMsg({ msg: `${e}`, err: true, pen: false });
    }
  };

  return (
    <>
      {!resMsg.pen ? (
        <form
          onSubmit={formik.handleSubmit}
          className="w-full flex flex-col gap-2 mt-2"
        >
          <label className="mx-auto text-md" htmlFor="title">
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
          <label className="mx-auto text-md" htmlFor="description">
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
          <label className="mx-auto text-md" htmlFor="tags">
            Tags
          </label>
          <input
            className="text-center"
            id="tags"
            name="tags"
            onChange={formik.handleChange}
            value={formik.values.tags}
          />
          <label className="mx-auto text-md" htmlFor="body">
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
            className="bg-rose-500"
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
            className="bg-rose-500"
          >
            {slug ? "Update post" : "Create post"}
          </button>
        </form>
      ) : (
        <div className="my-10 drop-shadow">
          <ImSpinner8 className="animate-spin text-4xl mx-auto" />
          <p className="text-center text-lg font-bold">{resMsg.msg}</p>
        </div>
      )}
    </>
  );
}
