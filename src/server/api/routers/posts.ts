import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, privateProcedure } from "~/server/api/trpc";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";

 
const filterUserForClient = (user: User) => {
  return {id: user.id, username: user.username, profileImageUrl: user.profileImageUrl}
}

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{createdAt: "desc"}]
    });
 
    const userId = posts.map((post) => post.authorId);
    const users = (
      await clerkClient.users.getUserList({
        userId: userId,
        limit: 110,
      })
    ).map(filterUserForClient);
  
    console.log('Users List:', users);
    
    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author) {
        console.error("AUTHOR NOT FOUND", post);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId} ??`,
        });
      }
      if (!author.username) {{
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Author has no GitHub Account: ${author.id}`,
          });
        }
      
      }
      return {
        post,
        author: {
          ...author,
          username: author.username ?? "(username not found)",
        },
      };
    });
  }), 

  create: privateProcedure
  .input(
    z.object({
      content: z.string().emoji("Only emojis are allowed").min(1).max(280),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const authorId = ctx.userId;

    
    

    const post = await ctx.prisma.post.create({
      data: {
        authorId,
        content: input.content,
      },
    });

    return post;
  }),

});

