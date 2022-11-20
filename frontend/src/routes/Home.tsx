import { useEffect, useState } from "react";
import PostCard from "../components/postList/PostCard";
import User from "../components/User";

import { IPost } from "../context/PostContext";
import useUsers from "../context/UsersContext";
import { getPosts, getPopularPosts } from "../services/posts";
import { toggleLike, toggleShare } from "../services/posts";

export default function Home() {
  const { cacheUserData, getUserData } = useUsers();

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: true });
  const [posts, setPosts] = useState<IPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<IPost[]>([]);

  useEffect(() => {
    getPosts()
      .then((posts) => {
        setPosts(posts);
        let uids: string[] = [];
        posts.forEach((post: any) => {
          if (!uids.includes(post.author.id)) uids.push(post.author.id);
        });
        uids.forEach((uid) => {
          cacheUserData(uid);
        });
        setResMsg({ msg: "", err: false, pen: false });
      })
      .catch((e) => {
        setResMsg({ msg: `${e}`, err: true, pen: false });
      });
    getPopularPosts()
      .then((posts) => {
        setPopularPosts(posts);
        let uids: string[] = [];
        popularPosts.forEach((post: any) => {
          if (!uids.includes(post.author.id)) uids.push(post.author.id);
        });
        uids.forEach((uid) => {
          cacheUserData(uid);
        });
        setResMsg({ msg: "", err: false, pen: false });
      })
      .catch((e) => {
        setResMsg({ msg: `${e}`, err: true, pen: false });
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
          newPosts[i].likes = newPosts[i].likes + (addLike ? 1 : -1);
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
          newPosts[i].shares = newPosts[i].shares + (addShare ? 1 : -1);
        }
        return [...newPosts];
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-full flex gap-3 p-3">
      <div className="flex flex-col gap-3">
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
      <div className="bg-foreground border dark:border-stone-800 shadow-lg dark:bg-darkmodeForeground pointer text-center rounded p-2">
        <h2 className="whitespace-nowrap font-extrabold tracking-tight text-md">
          Popular posts
        </h2>
        <div style={{maxWidth:"22.5pc"}} className="flex flex-col items-center justify-center">
          {popularPosts &&
            popularPosts.length > 0 &&
            popularPosts.map((post) => (
              <>
                <article className="leading-5 py-1 my-1 mb-4 rounded-sm">
                  <h3 className="font-bold text-sm leading-4 my-0">{post.title}</h3>
                  <p className="text-xs leading-3 my-0 mb-2 py-0.5">{post.description}<a href={`/posts/${post.slug}`} className="font-bold italic cursor-pointer"> - Read more</a></p>
                  <User likeShareIcons likes={post.likes} shares={post.shares} uid={post.author.id} user={getUserData(post.author.id)}/>
                </article>
                {/*<PostCard
              handleToggleLike={handleToggleLike}
              handleToggleShare={handleToggleShare}
              key={post.id}
              post={post}
          />*/}
              </>
            ))}
        </div>
      </div>
    </div>
  );
}
