# Prisma-Social-Media

This is my porfolio project. It's supposed to be like a cross between Discord and Reddit. It has group video chat, filesharing, embedded comments, likes and shares, invites, kicking and banning users from rooms and a public blog. Everything updates live, if a user component or a post is visible the client will subscribe to updates for that visible component. Comments, likes and shares are also live.

It uses JWTs stored in secure httpOnly cookies for authentication. New accounts are deleted automatically after 20 minutes along with all their posts and other associated data.

I am a "hobbyist" developer. The most difficult part was getting video chat to work properly, I fixed it eventually by adding timeouts, but I have no idea why it worked.

Made using primarily
- Prisma
- Redis
- React & TailwindCSS
- Express & Socket io
- WebRTC (simple-peer)
- Amazon S3 Storage bucket
- Amazon RDS
- Typescript
