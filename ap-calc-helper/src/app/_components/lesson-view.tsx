"use client";

import { useEffect, useRef, useState } from "react";
import { buildGreeting } from "@/features/ap-calculus-bc/prompts";
import type { APCalcBCSection } from "@/features/ap-calculus-bc/syllabus";
import { api } from "@/trpc/react";
import { MathDisplay } from "./math-display";
import { TypingBubble } from "./typing-bubble";

// ---------- Types ----------

type Message = {
	id: number;
	role: "tutor" | "student";
	text: string;
	math: string[];
};

type HistoryEntry = { role: "tutor" | "student"; content: string };

type LessonPhase = "diagnostic" | "teaching";

// ---------- Helpers ----------

let idSeq = 0;

function playBase64Audio(base64: string) {
	const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	const blob = new Blob([bytes], { type: "audio/wav" });
	const audio = new Audio(URL.createObjectURL(blob));
	audio.play().catch(() => {});
}

// ---------- Component ----------

export function LessonView({ section }: { section: APCalcBCSection }) {
	const [phase, setPhase] = useState<LessonPhase>("diagnostic");
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [pending, setPending] = useState<string | null>(null);
	const [misconceptions, setMisconceptions] = useState<string[]>([]);
	const [busy, setBusy] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);
	const didInit = useRef(false);

	const chatMutation = api.tutor.chat.useMutation();

	// Auto-scroll
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	async function ask(p: LessonPhase, history: HistoryEntry[], gaps: string[]) {
		setBusy(true);
		try {
			const res = await chatMutation.mutateAsync({
				sectionId: section.id,
				phase: p,
				conversationHistory: history,
				misconceptions: gaps,
			});

			idSeq += 1;
			const tutorMsg: Message = {
				id: idSeq,
				role: "tutor",
				text: res.spokenText,
				math: res.displayMath,
			};
			setMessages((prev) => [...prev, tutorMsg]);

			if (res.misconceptionNotes.length > 0) {
				setMisconceptions((prev) => [...prev, ...res.misconceptionNotes]);
			}
			if (res.diagnosticComplete && p === "diagnostic") {
				setPhase("teaching");
			}
			if (res.audioBase64) {
				playBase64Audio(res.audioBase64);
			}
		} finally {
			setBusy(false);
		}
	}

	// Show greeting instantly, then fetch first question
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time init
	useEffect(() => {
		if (didInit.current) return;
		didInit.current = true;

		const greeting = buildGreeting(section);
		idSeq += 1;
		const greetingMsg: Message = {
			id: idSeq,
			role: "tutor",
			text: greeting,
			math: [],
		};
		setMessages([greetingMsg]);

		// Include greeting in history so AI knows context
		const history: HistoryEntry[] = [{ role: "tutor", content: greeting }];
		void ask("diagnostic", history, []);
	}, []);

	function handleType(e: React.FormEvent) {
		e.preventDefault();
		const text = input.trim();
		if (!text || busy) return;
		setPending(text);
		setInput("");
	}

	function handleConfirm() {
		if (!pending) return;
		const answer = pending;
		setPending(null);

		idSeq += 1;
		const studentMsg: Message = {
			id: idSeq,
			role: "student",
			text: answer,
			math: [],
		};

		const currentPhase = phase;
		const currentMisconceptions = misconceptions;
		setMessages((prev) => {
			const next = [...prev, studentMsg];
			const history: HistoryEntry[] = next.map((m) => ({
				role: m.role,
				content: m.text,
			}));
			queueMicrotask(() => ask(currentPhase, history, currentMisconceptions));
			return next;
		});
	}

	function handleEdit() {
		if (!pending) return;
		setInput(pending);
		setPending(null);
	}

	const latestMath =
		[...messages].reverse().find((m) => m.math.length > 0)?.math ?? [];

	return (
		<div className="flex h-[calc(100vh-3rem)] flex-col">
			{/* Visual teaching panel */}
			{latestMath.length > 0 && (
				<div className="flex flex-wrap items-center gap-4 border-slate-800 border-b bg-slate-900/70 px-6 py-4">
					{latestMath.map((latex, i) => (
						<MathDisplay key={`${i}-${latex}`} latex={latex} />
					))}
				</div>
			)}

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-6 py-4">
				<div className="mx-auto flex max-w-3xl flex-col gap-4">
					<div className="flex items-center gap-2">
						<span className="rounded bg-violet-500/20 px-2 py-0.5 font-medium text-violet-300 text-xs">
							{phase === "diagnostic" ? "Diagnostic" : "Lesson"}
						</span>
						<span className="text-slate-400 text-xs">{section.title}</span>
					</div>

					{messages.map((msg) => (
						<div
							className={
								msg.role === "tutor"
									? "self-start rounded-lg bg-slate-800 px-4 py-3"
									: "self-end rounded-lg bg-violet-600/30 px-4 py-3"
							}
							key={msg.id}
						>
							<p className="text-sm">{msg.text}</p>
							{msg.math.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-3">
									{msg.math.map((latex, i) => (
										<MathDisplay
											className="text-sm"
											key={`${i}-${latex}`}
											latex={latex}
										/>
									))}
								</div>
							)}
						</div>
					))}

					{pending && (
						<div className="self-end rounded-lg border border-violet-500/40 bg-violet-600/10 px-4 py-3">
							<p className="text-slate-300 text-xs">
								Is this what you want to submit?
							</p>
							<p className="mt-1 text-sm">{pending}</p>
							<div className="mt-2 flex gap-2">
								<button
									className="rounded bg-violet-500 px-3 py-1 font-medium text-white text-xs transition hover:bg-violet-400"
									onClick={handleConfirm}
									type="button"
								>
									Confirm
								</button>
								<button
									className="rounded bg-slate-700 px-3 py-1 text-xs transition hover:bg-slate-600"
									onClick={handleEdit}
									type="button"
								>
									Edit
								</button>
							</div>
						</div>
					)}

					{busy && <TypingBubble />}

					<div ref={bottomRef} />
				</div>
			</div>

			{/* Input */}
			<form
				className="flex items-center gap-3 border-slate-800 border-t bg-slate-950 px-6 py-3"
				onSubmit={handleType}
			>
				<input
					className="flex-1 rounded-md bg-slate-800 px-4 py-2 text-slate-100 text-sm placeholder-slate-500 outline-none ring-1 ring-slate-700 focus:ring-violet-500"
					disabled={busy || pending !== null}
					onChange={(e) => setInput(e.target.value)}
					placeholder={
						phase === "diagnostic"
							? "Type your answer…"
							: "Ask a question or answer…"
					}
					value={input}
				/>
				<button
					className="rounded-md bg-violet-500 px-4 py-2 font-semibold text-sm text-white transition hover:bg-violet-400 disabled:opacity-40"
					disabled={busy || !input.trim() || pending !== null}
					type="submit"
				>
					Send
				</button>
			</form>
		</div>
	);
}
