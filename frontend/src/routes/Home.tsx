export default function Home() {
  return (
    <div className="w-full h-full flex flex-col items-center text-center gap-3 p-3">
      <h1 className="font-extrabold text-3xl leading-5 pt-4">
        Prisma-social-media
      </h1>
      <h2 className="text-md py-0 font-bold leading-5">By Jason</h2>
      <p className="text-sm">
        Welcome. This is my new portfolio project. Its main features are group
        video chat, embedded comments, customizable chatrooms, markdown
        blogging, private messaging and uploading video attachments. You can
        also send files and images and see the upload progress. Everything
        updates in realtime depending on component visibility.
      </p>
      <p>
        You can create an account with just a username and password, or log into
        one of the test accounts if you prefer. The password for the test
        accounts is "Test1234!". You can also direct message, kick, ban or
        invite other users to your rooms by clicking on profile images.
      </p>
      <p>
        The frontend was made using React, Typescript and TailwindCSS. The
        backend uses Express, Prisma, Typescript, Socket.io, Amazon RDS
        postgreSQL database and Amazon S3 storage bucket. API routes are
        protected by my custom rate limiter. Everything is updated in realtime
        depending on component visibility and all the images are automatically
        processed to reduce filesize. Thumbnails and a blur placeholder are
        generated for post cover images.
      </p>
      <div className="font-bold leading-4 text-md">
        If you want to test out the video chat you have to use a non chromium
        based browser like firefox. Chromium based browsers like chrome and
        microsoft edge will always deny access to the camera even after giving
        permission.
      </div>
    </div>
  );
}
