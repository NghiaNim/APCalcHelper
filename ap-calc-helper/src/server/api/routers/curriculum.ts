import { AP_CALC_BC_SECTIONS } from "@/features/ap-calculus-bc/syllabus";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const curriculumRouter = createTRPCRouter({
	listSections: publicProcedure.query(() => {
		return AP_CALC_BC_SECTIONS;
	}),
});
