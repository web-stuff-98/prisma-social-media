import { useLayoutEffect, useRef } from "react";
import { IUser } from "../../context/AuthContext";
import { IPost, usePosts } from "../../context/PostsContext";
import useUsers from "../../context/UsersContext";

export default function PostCardShare({ slug }: { slug: string }) {
  const { postEnteredView, postLeftView, getPostData } = usePosts();
  const { getUserData } = useUsers();

  const containerRef = useRef<HTMLDivElement>(null);

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      postEnteredView(slug);
    } else {
      postLeftView(slug);
    }
  });
  useLayoutEffect(() => {
    observer.observe(containerRef.current!);
    return () => {
      postLeftView(slug);
      observer.disconnect();
    };
    //putting the ref in the dependency array was the only way to get this working properly for some reason
  }, [containerRef.current]);

  const renderAuthorName = (user?: IUser) => (user ? user.name : "");

  const render = (post?: Partial<IPost>) => {
    return post ? (
      <>
        <div
          style={{
            backgroundImage: `url(${post.blur})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          className="z-30 w-full h-full absolute rounded"
        />
        <div
          style={{ backdropFilter: "blur(4px)" }}
          className="absolute rounded z-40 w-full h-full drop-shadow flex flex-col items-center justify-center text-center"
        >
          <h3
            style={{ textShadow: "0px 2px 3px black" }}
            className="text-sm text-white font-bold"
          >
            {post.title} by {renderAuthorName(getUserData(post.author?.id!))}
          </h3>
        </div>
      </>
    ) : (
      <>{JSON.stringify(post)}</>
    );
  };

  return (
    <div className="relative w-full h-10" ref={containerRef}>
      {render(getPostData(slug))}
    </div>
  );
}
