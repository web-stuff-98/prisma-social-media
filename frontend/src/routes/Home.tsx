import ReactPlayer from "react-player";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col items-center text-center gap-3 p-3">
      <h1 className="font-extrabold text-3xl leading-5 pt-4">
        Prisma-social-media
      </h1>
      <h2 className="text-md py-0 font-bold leading-5">By Jason</h2>
      <p className="text-sm">
        Welcome. This is my new social media portfolio project. I made it with
        express instead of Next this time, because I hadn't used express for a
        big project in a while. Its features are group video chat, embedded
        comments, liking, sharing, filesharing, progress bars, image processing,
        et cetera... everything updates live through socket events depending on
        component visibility. I also wrote a custom rate limiter for protecting
        logins and preventing spam. It uses JWT httpOnly cookie logins.
      </p>
      <div className="w-full">
        <ReactPlayer
          controls
          width={"100%"}
          height={"auto"}
          url={"https://d2gt89ey9qb5n6.cloudfront.net/vid.mp4"}
        />
      </div>
      <div className="font-bold leading-4 text-md">
        If you want to test out the video chat you have to use a non chromium
        based browser like firefox. Chromium based browsers like chrome and
        microsoft edge will always deny access to the camera even after allowing
        permission for some reason.
      </div>
    </div>
  );
}
