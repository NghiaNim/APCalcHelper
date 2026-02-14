"use client";

export function TypingBubble() {
	return (
		<div className="self-start rounded-lg bg-slate-800 px-4 py-3">
			<div className="flex items-center gap-1.5">
				<span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
				<span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
				<span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
			</div>
		</div>
	);
}
