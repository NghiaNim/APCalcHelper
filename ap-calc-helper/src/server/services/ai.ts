import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import { env } from "@/env";

// ---------- Provider ----------

const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });

// ---------- Schemas ----------

export const tutorResponseSchema = z.object({
	spokenText: z
		.string()
		.describe("What the tutor says out loud — conversational and clear"),
	displayMath: z
		.array(z.string())
		.describe("LaTeX expressions to show on screen, e.g. \\sin(x^2)"),
	isQuestion: z
		.boolean()
		.describe("True when the tutor is asking the student something"),
	diagnosticComplete: z
		.boolean()
		.describe(
			"True once the diagnostic phase is done and the lesson should begin",
		),
	misconceptionNotes: z
		.array(z.string())
		.describe("Observed reasoning gaps — empty array if none"),
	eloScore: z
		.number()
		.int()
		.min(400)
		.max(2400)
		.nullable()
		.describe(
			"ELO rating 400-2400 assigned ONLY when diagnosticComplete is true. null otherwise.",
		),
});

export type TutorResponse = z.infer<typeof tutorResponseSchema>;

export type ConversationMessage = {
	role: "tutor" | "student";
	content: string;
};

// ---------- Chat ----------

export async function chatWithTutor(
	systemPrompt: string,
	history: ConversationMessage[],
): Promise<TutorResponse> {
	const messages = history.map((msg) => ({
		role: msg.role === "tutor" ? ("assistant" as const) : ("user" as const),
		content: msg.content,
	}));

	if (messages.length === 0 || messages[0]?.role === "assistant") {
		messages.unshift({ role: "user" as const, content: "Start the session." });
	}

	const { object } = await generateObject({
		model: google("gemini-2.5-flash"),
		system: systemPrompt,
		messages,
		schema: tutorResponseSchema,
	});

	return object;
}
