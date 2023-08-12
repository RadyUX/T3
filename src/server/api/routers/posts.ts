import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { User } from "@clerk/nextjs/dist/types/server";

const filteredUser = (user: User) => {
  return {id: user.id, name: user.username, profilePicture: user.profileImageUrl}
}
export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    const users = (

    await clerkClient.users.getUserList({
      userId: posts.map((post)=> post.authorId),
      limit:100 
    })
    ).map(filteredUser)

    return posts.map(post =>({
        post,
      author: users.find((user)=> user.id === post.id)}
    ))
  }),


});
