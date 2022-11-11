import axios from "axios";
import { useEffect, useState } from "react";
import PostCard from "../components/postList/PostCard";
import useAsync from "../hooks/useAsync";
import { getPosts } from "../services/posts";

import { IPost } from "../context/PostContext";
import { makeRequest } from "../services/makeRequest";

export default function Home() {
  const [status, setStatus] = useState("pending");
  const [err, setErr] = useState("")
  const [posts, setPosts] = useState<IPost[]>([]);

  const getPosts = async () => {
    try { 
      const res = await makeRequest("/api/posts")
      setPosts(res)
    } catch (e) {
      setErr(`${e}`)
      setStatus("error")
    }
  };

  useEffect(() => {
    getPosts()
  }, [])

  return (
    <div className="w-full h-full">
      <div className="flex flex-col gap-3 p-3">
        {posts &&
          posts.length > 0 &&
          posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
