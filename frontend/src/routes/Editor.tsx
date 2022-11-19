import { useFormik } from "formik";
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useParams } from "react-router-dom";

import { createPost, getPost, updatePost } from "../services/posts";
import { ImSpinner8 } from "react-icons/im";
import { IPost } from "../context/PostContext";

export default function Editor() {
  const { slug } = useParams();

  const [resMsg, setResMsg] = useState({ err: false, pen: false, msg: "" });

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      body: "",
      tags: "",
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
      setResMsg({msg:"", err:false, pen:false})
    } catch (e) {
      setResMsg({ msg: `${e}`, err: true, pen: false });
    }
  };

  useEffect(() => {
    if (slug) loadIntoEditor();
  }, [slug]);

  return (
    <>
      {!resMsg.pen ? (
          <form onSubmit={formik.handleSubmit} className="w-full flex flex-col gap-2 mt-2">
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
            <button>{slug ? "Update post" : "Create post"}</button>
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
