import Link from "next/link";
import { notFound } from "next/navigation";

import { getSectionById } from "@/features/ap-calculus-bc/syllabus";
import { auth } from "@/server/auth";

type LearnSectionPageProps = {
	params: Promise<{
		sectionId: string;
	}>;
};

export default async function LearnSectionPage({
	params,
}: LearnSectionPageProps) {
	const { sectionId } = await params;
	const section = getSectionById(sectionId);
	const session = await auth();

	if (!section) {
		notFound();
	}

	return (
		<main className="min-h-screen bg-slate-950 text-slate-100">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
				<div className="flex items-center justify-between gap-4">
					<Link
						className="text-sm text-violet-300 hover:text-violet-200"
						href="/"
					>
						Back to all sections
					</Link>
					<Link
						className="rounded-md bg-violet-500 px-4 py-2 font-semibold text-sm text-white transition hover:bg-violet-400"
						href={session ? "/api/auth/signout" : "/api/auth/signin"}
					>
						{session ? "Sign out" : "Sign in"}
					</Link>
				</div>

				<header className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
					<p className="font-semibold text-sm text-violet-300">
						Unit {section.unit}
					</p>
					<h1 className="mt-2 font-bold text-3xl">{section.title}</h1>
					<p className="mt-3 text-slate-300 text-sm">
						Use this section to practice conceptual reasoning before advanced
						problem-solving.
					</p>
					<Link
						className="mt-4 inline-block rounded-md bg-violet-500 px-5 py-2 font-semibold text-sm text-white transition hover:bg-violet-400"
						href={`/learn/${sectionId}/lesson`}
					>
						{session ? "Start Lesson" : "Sign in to start lesson"}
					</Link>
				</header>

				<section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
					<h2 className="font-semibold text-xl">Learning objectives</h2>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
						{section.objectives.map((objective) => (
							<li key={objective}>{objective}</li>
						))}
					</ul>
				</section>

				<section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
					<h2 className="font-semibold text-xl">Common question types</h2>
					<ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
						{section.commonQuestionTypes.map((questionType) => (
							<li key={questionType}>{questionType}</li>
						))}
					</ul>
				</section>
			</div>
		</main>
	);
}
