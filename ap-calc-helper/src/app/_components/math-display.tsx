"use client";

import katex from "katex";
import { useMemo } from "react";

type MathDisplayProps = {
	latex: string;
	display?: boolean;
	className?: string;
};

export function MathDisplay({
	latex,
	display = true,
	className,
}: MathDisplayProps) {
	const html = useMemo(
		() =>
			katex.renderToString(latex, {
				displayMode: display,
				throwOnError: false,
			}),
		[latex, display],
	);

	return (
		<span
			className={className}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output is trusted
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
