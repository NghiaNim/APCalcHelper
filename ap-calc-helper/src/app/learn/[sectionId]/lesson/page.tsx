import { notFound, redirect } from "next/navigation";
import { LessonView } from "@/app/_components/lesson-view";
import { getSectionById } from "@/features/ap-calculus-bc/syllabus";
import { auth } from "@/server/auth";

type LessonPageProps = {
	params: Promise<{ sectionId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
	const session = await auth();
	if (!session?.user) {
		redirect("/api/auth/signin");
	}

	const { sectionId } = await params;
	const section = getSectionById(sectionId);
	if (!section) {
		notFound();
	}

	return (
		<main className="min-h-screen bg-slate-950 text-slate-100">
			<LessonView section={section} />
		</main>
	);
}
