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
        logins and preventing spam. It uses JWT httpOnly cookie based logins.
      </p>
      <p>
        To access the user actions dropdown menu click on a users profile
        picture. From there you can invite the user to a chatroom, direct
        message them, view their profile, and kick them or ban them from a room.
        You can only access this menu when you are logged in. You can create an
        account with just a username and password, or log into one of the test
        accounts if you prefer. The password for the test accounts is
        "Test1234!". Once logged in you can also access chat by clicking on the
        icon in the bottom right end of the screen.
      </p>
      <p>
        The frontend was made using React, Typescript and TailwindCSS. The
        backend uses Express, Prisma, Typescript, Redis, Socket.io, Amazon RDS
        postgreSQL database and Amazon S3 storage bucket. API routes are
        protected by Yup and my redis rate limiter middlewares. Live updates
        depend on component visibility and all the images are automatically
        processed to reduce filesize. Thumbnails are lazyloaded and a blur
        placeholder is generated for post cover images. Pagination and search
        are handled serverside using query params.
      </p>
      <div className="font-bold leading-4 text-md">
        If you want to test out the video chat you have to use a non chromium
        based browser like firefox. Chromium based browsers like chrome and
        microsoft edge will always deny access to the camera even after allowing
        permission for some reason.
      </div>
    </div>
  );
}
