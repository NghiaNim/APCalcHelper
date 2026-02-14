import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { isValidSectionId } from "@/features/ap-calculus-bc/syllabus";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const learnerStyleSchema = z.enum(["visual", "guided", "challenge"]);

export const learningRouter = createTRPCRouter({
	upsertStudentProfile: protectedProcedure
		.input(
			z.object({
				learnerStyle: learnerStyleSchema,
				pacingPreference: z.enum(["slow", "balanced", "fast"]),
				learningGoals: z.string().trim().min(1).max(500),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.studentProfile.upsert({
				where: { userId: ctx.session.user.id },
				update: {
					learnerStyle: input.learnerStyle,
					pacingPreference: input.pacingPreference,
					learningGoals: input.learningGoals,
				},
				create: {
					userId: ctx.session.user.id,
					learnerStyle: input.learnerStyle,
					pacingPreference: input.pacingPreference,
					learningGoals: input.learningGoals,
				},
			});
		}),

	startSession: protectedProcedure
		.input(
			z.object({
				sectionId: z.string(),
				objective: z.string().trim().min(1).max(280),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!isValidSectionId(input.sectionId)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid AP Calculus BC section id.",
				});
			}

			return ctx.db.learningSession.create({
				data: {
					userId: ctx.session.user.id,
					sectionId: input.sectionId,
					objective: input.objective,
				},
			});
		}),

	listRecentSessions: protectedProcedure
		.input(
			z.object({
				limit: z.number().int().positive().max(20).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			return ctx.db.learningSession.findMany({
				where: { userId: ctx.session.user.id },
				orderBy: { startedAt: "desc" },
				take: input.limit,
				include: {
					misconceptions: true,
				},
			});
		}),
});
