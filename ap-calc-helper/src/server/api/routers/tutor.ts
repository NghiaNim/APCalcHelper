import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	buildDiagnosticPrompt,
	buildTeachingPrompt,
} from "@/features/ap-calculus-bc/prompts";
import { getSectionById } from "@/features/ap-calculus-bc/syllabus";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { chatWithTutor } from "@/server/services/ai";
import { generateTTS } from "@/server/services/tts";

const messageSchema = z.object({
	role: z.enum(["tutor", "student"]),
	content: z.string(),
});

export const tutorRouter = createTRPCRouter({
	chat: protectedProcedure
		.input(
			z.object({
				sectionId: z.string(),
				phase: z.enum(["diagnostic", "teaching"]),
				conversationHistory: z.array(messageSchema),
				misconceptions: z.array(z.string()).default([]),
				eloScore: z.number().int().nullable().default(null),
			}),
		)
		.mutation(async ({ input }) => {
			const section = getSectionById(input.sectionId);
			if (!section) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid section id.",
				});
			}

			const systemPrompt =
				input.phase === "diagnostic"
					? buildDiagnosticPrompt(section)
					: buildTeachingPrompt(section, input.misconceptions, input.eloScore);

			const result = await chatWithTutor(
				systemPrompt,
				input.conversationHistory,
			);

			const audioBase64 = await generateTTS(result.spokenText);

			return { ...result, audioBase64 };
		}),
});
