import Link from "next/link";

import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

export default async function Home() {
	const session = await auth();
	const sections = await api.curriculum.listSections();

	return (
		<HydrateClient>
			<main className="min-h-screen bg-slate-950 text-slate-100">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
					<header className="flex flex-col gap-4">
						<p className="font-medium text-sm text-violet-300">
							AP Calculus BC Interactive Tutor
						</p>
						<h1 className="max-w-4xl font-bold text-4xl tracking-tight sm:text-5xl">
							Live, adaptive calculus tutoring focused on student reasoning.
						</h1>
						<p className="max-w-3xl text-base text-slate-300 sm:text-lg">
							Choose a section, practice with guided questions, and build deeper
							conceptual understanding through voice and visual feedback.
						</p>
						<div className="flex flex-wrap items-center gap-3 pt-2">
							<Link
								className="rounded-md bg-violet-500 px-4 py-2 font-semibold text-sm text-white transition hover:bg-violet-400"
								href={session ? "/api/auth/signout" : "/api/auth/signin"}
							>
								{session ? "Sign out" : "Sign in to start tracking"}
							</Link>
							{session?.user ? (
								<p className="text-slate-300 text-sm">
									Logged in as {session.user.name ?? "student"}
								</p>
							) : (
								<p className="text-slate-400 text-sm">
									Sign in to save progress and session history.
								</p>
							)}
						</div>
					</header>

					<section className="flex flex-col gap-4">
						<div className="flex items-end justify-between gap-4">
							<div>
								<h2 className="font-semibold text-2xl">Start with a section</h2>
								<p className="text-slate-300 text-sm">
									First feature: AP Calculus BC curriculum navigator.
								</p>
							</div>
							<p className="text-slate-400 text-sm">
								{sections.length} sections
							</p>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{sections.map((section) => (
								<article
									className="rounded-lg border border-slate-800 bg-slate-900/60 p-5"
									key={section.id}
								>
									<div className="flex items-center justify-between gap-3">
										<p className="font-semibold text-sm text-violet-300">
											Unit {section.unit}
										</p>
										<Link
											className="font-medium text-sm text-violet-300 hover:text-violet-200"
											href={`/learn/${section.id}`}
										>
											Open section
										</Link>
									</div>
									<h3 className="mt-2 font-semibold text-xl">
										{section.title}
									</h3>
									<p className="mt-3 text-slate-300 text-sm">
										Key objective: {section.objectives[0]}
									</p>
								</article>
							))}
						</div>
					</section>

					<section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5 text-slate-300 text-sm">
						<p className="font-semibold text-slate-100">What comes next</p>
						<p className="mt-2">
							Upcoming features include onboarding profiles, live voice
							tutoring, and misconception diagnosis from student handwritten
							work.
						</p>
					</section>
				</div>
			</main>
		</HydrateClient>
	);
}
