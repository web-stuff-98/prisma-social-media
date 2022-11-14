import { useEffect, useState } from "react";
import PostCard from "../components/postList/PostCard";

import { IPost } from "../context/PostContext";
import useUsers from "../context/UsersContext";
import { getPosts } from "../services/posts";
import { toggleLike, toggleShare } from "../services/posts";

export default function Home() {
  const { cacheUserData } = useUsers()

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: true });
  const [posts, setPosts] = useState<IPost[]>([]);

  useEffect(() => {
    getPosts()
      .then((posts) => {
        setPosts(posts);
        let uids: string[] = [];
        posts.forEach((post: any) => {
          if (!uids.includes(post.author.id)) uids.push(post.author.id);
        });
        uids.forEach((uid) => {
          cacheUserData(uid)
        })
        setResMsg({msg:"",err:false,pen:false})
      })
      .catch((e) => {
        setResMsg({msg:`${e}`,err:true,pen:false})
      });
  }, []);

  const handleToggleLike = async (postId: string) => {
    try {
      const { addLike } = await toggleLike(postId);
      setPosts((prevPosts) => {
        let newPosts = prevPosts;
        const i = prevPosts.findIndex((post) => post.id === postId);
        if (i !== -1) {
          newPosts[i].likedByMe = addLike;
          newPosts[i].likes = newPosts[i].likes + addLike ? 1 : -1;
        }
        return [...newPosts];
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleShare = async (postId: string) => {
    try {
      const { addShare } = await toggleShare(postId);
      setPosts((prevPosts) => {
        let newPosts = prevPosts;
        const i = prevPosts.findIndex((post) => post.id === postId);
        if (i !== -1) {
          newPosts[i].sharedByMe = addShare;
          newPosts[i].shares = newPosts[i].likes + addShare ? 1 : -1;
        }
        return [...newPosts];
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col gap-3 p-3">
        {posts &&
          posts.length > 0 &&
          posts.map((post) => (
            <PostCard
              handleToggleLike={handleToggleLike}
              handleToggleShare={handleToggleShare}
              key={post.id}
              post={post}
            />
          ))}
      </div>
    </div>
  );
}
