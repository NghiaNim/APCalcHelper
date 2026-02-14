import { curriculumRouter } from "@/server/api/routers/curriculum";
import { learningRouter } from "@/server/api/routers/learning";
import { postRouter } from "@/server/api/routers/post";
import { tutorRouter } from "@/server/api/routers/tutor";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	curriculum: curriculumRouter,
	learning: learningRouter,
	post: postRouter,
	tutor: tutorRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
