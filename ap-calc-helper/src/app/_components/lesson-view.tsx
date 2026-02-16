"use client";

import { useRef, useState, useSyncExternalStore } from "react";
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

type LessonPhase = "diagnostic" | "elo-reveal" | "teaching";

const DIAGNOSTIC_LIMIT_MS = 5 * 60 * 1000;

// ---------- Countdown via useSyncExternalStore ----------

function subscribeToTick(cb: () => void) {
	const id = setInterval(cb, 1000);
	return () => clearInterval(id);
}

function useCountdown(deadlineMs: number | null): number {
	const snap = () => {
		if (deadlineMs === null) return -1;
		return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
	};
	return useSyncExternalStore(subscribeToTick, snap, snap);
}

// ---------- Helpers ----------

let idSeq = 0;
function nextId() {
	idSeq += 1;
	return idSeq;
}

function playBase64Audio(base64: string) {
	const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	const blob = new Blob([bytes], { type: "audio/wav" });
	const audio = new Audio(URL.createObjectURL(blob));
	audio.play().catch(() => {});
}

function formatTime(s: number): string {
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${sec.toString().padStart(2, "0")}`;
}

function eloLabel(elo: number): string {
	if (elo < 800) return "Building Foundations";
	if (elo < 1200) return "Developing";
	if (elo < 1600) return "Proficient";
	if (elo < 2000) return "Advanced";
	return "Near-Mastery";
}

function toHistory(msgs: Message[]): HistoryEntry[] {
	return msgs.map((m) => ({ role: m.role, content: m.text }));
}

function scrollToBottom(ref: React.RefObject<HTMLDivElement | null>) {
	requestAnimationFrame(() => {
		ref.current?.scrollIntoView({ behavior: "smooth" });
	});
}

// ---------- Component ----------

export function LessonView({ section }: { section: APCalcBCSection }) {
	const [phase, setPhase] = useState<LessonPhase>("diagnostic");
	const [messages, setMessages] = useState<Message[]>(() => [
		{ id: nextId(), role: "tutor", text: buildGreeting(section), math: [] },
	]);
	const [input, setInput] = useState("");
	const [pending, setPending] = useState<string | null>(null);
	const [misconceptions, setMisconceptions] = useState<string[]>([]);
	const [eloScore, setEloScore] = useState<number | null>(null);
	const [busy, setBusy] = useState(false);

	const [deadline] = useState(() => Date.now() + DIAGNOSTIC_LIMIT_MS);
	const secondsLeft = useCountdown(phase === "diagnostic" ? deadline : null);

	const bottomRef = useRef<HTMLDivElement>(null);
	const didInit = useRef(false);
	const didTimeUp = useRef(false);

	const chatMutation = api.tutor.chat.useMutation();

	// ---- Core: send a request and process the response ----

	async function ask(p: LessonPhase, history: HistoryEntry[], gaps: string[]) {
		setBusy(true);
		scrollToBottom(bottomRef);
		try {
			const res = await chatMutation.mutateAsync({
				sectionId: section.id,
				phase: p === "diagnostic" ? "diagnostic" : "teaching",
				conversationHistory: history,
				misconceptions: gaps,
				eloScore,
			});

			const tutorMsg: Message = {
				id: nextId(),
				role: "tutor",
				text: res.spokenText,
				math: res.displayMath,
			};
			setMessages((prev) => [...prev, tutorMsg]);

			if (res.misconceptionNotes.length > 0) {
				setMisconceptions((prev) => [...prev, ...res.misconceptionNotes]);
			}
			if (res.diagnosticComplete && p === "diagnostic") {
				setEloScore(res.eloScore ?? 1000);
				setPhase("elo-reveal");
			}
			if (res.audioBase64) {
				playBase64Audio(res.audioBase64);
			}
		} finally {
			setBusy(false);
			scrollToBottom(bottomRef);
		}
	}

	// ---- One-time init: ref guard during render, deferred side effect ----

	if (!didInit.current) {
		didInit.current = true;
		const greetingHistory = toHistory(messages);
		setTimeout(() => ask("diagnostic", greetingHistory, []), 0);
	}

	// ---- Time-up: ref guard during render, deferred side effect ----

	if (
		secondsLeft === 0 &&
		phase === "diagnostic" &&
		!didTimeUp.current &&
		!busy
	) {
		didTimeUp.current = true;
		setTimeout(() => {
			const timeUpMsg: Message = {
				id: nextId(),
				role: "student",
				text: "Time is up — please wrap up the diagnostic.",
				math: [],
			};
			setPending(null);
			setMessages((prev) => {
				const next = [...prev, timeUpMsg];
				void ask("diagnostic", toHistory(next), misconceptions);
				return next;
			});
		}, 0);
	}

	// ---- Event handlers ----

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

		const studentMsg: Message = {
			id: nextId(),
			role: "student",
			text: answer,
			math: [],
		};

		const currentPhase = phase;
		const currentGaps = misconceptions;
		setMessages((prev) => {
			const next = [...prev, studentMsg];
			void ask(currentPhase, toHistory(next), currentGaps);
			return next;
		});
		scrollToBottom(bottomRef);
	}

	function handleEdit() {
		if (!pending) return;
		setInput(pending);
		setPending(null);
	}

	function handleStartLesson() {
		setPhase("teaching");
		void ask("teaching", toHistory(messages), misconceptions);
	}

	// ---- Derived state ----

	const latestMath =
		[...messages].reverse().find((m) => m.math.length > 0)?.math ?? [];

	// ---- ELO reveal screen ----

	if (phase === "elo-reveal" && eloScore !== null) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
				<p className="font-medium text-slate-400 text-sm">
					Diagnostic Complete
				</p>
				<div className="flex flex-col items-center gap-2">
					<p className="font-bold text-6xl text-violet-300">{eloScore}</p>
					<p className="font-semibold text-lg text-slate-200">
						{eloLabel(eloScore)}
					</p>
				</div>
				<p className="max-w-md text-center text-slate-400 text-sm">
					Your lesson will be tailored to this level. The tutor will focus on
					{misconceptions.length > 0
						? ` addressing ${misconceptions.length} reasoning gap${misconceptions.length > 1 ? "s" : ""} found in the diagnostic.`
						: " reinforcing your strengths and pushing you further."}
				</p>
				<button
					className="mt-2 rounded-md bg-violet-500 px-6 py-2.5 font-semibold text-white transition hover:bg-violet-400"
					onClick={handleStartLesson}
					type="button"
				>
					Start Lesson
				</button>
			</div>
		);
	}

	// ---- Main UI ----

	return (
		<div className="flex h-[calc(100vh-3rem)] flex-col">
			{latestMath.length > 0 && (
				<div className="flex flex-wrap items-center gap-4 border-slate-800 border-b bg-slate-900/70 px-6 py-4">
					{latestMath.map((latex, i) => (
						<MathDisplay key={`${i}-${latex}`} latex={latex} />
					))}
				</div>
			)}

			<div className="flex-1 overflow-y-auto px-6 py-4">
				<div className="mx-auto flex max-w-3xl flex-col gap-4">
					<div className="flex items-center gap-2">
						<span className="rounded bg-violet-500/20 px-2 py-0.5 font-medium text-violet-300 text-xs">
							{phase === "diagnostic" ? "Diagnostic" : "Lesson"}
						</span>
						<span className="text-slate-400 text-xs">{section.title}</span>
						{phase === "diagnostic" && (
							<span
								className={`ml-auto font-mono text-xs ${secondsLeft <= 60 ? "text-red-400" : "text-slate-400"}`}
							>
								{formatTime(secondsLeft)}
							</span>
						)}
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
