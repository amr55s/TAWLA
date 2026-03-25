"use client";

import { useEffect, useState } from "react";

/**
 * Updates every second with elapsed whole seconds since `iso` (UTC timestamp).
 */
export function useElapsedSecondsSince(iso: string): number {
	const [seconds, setSeconds] = useState(() => elapsedSince(iso));

	useEffect(() => {
		setSeconds(elapsedSince(iso));
		const id = window.setInterval(() => {
			setSeconds(elapsedSince(iso));
		}, 1000);
		return () => window.clearInterval(id);
	}, [iso]);

	return seconds;
}

function elapsedSince(iso: string): number {
	const t = new Date(iso).getTime();
	if (Number.isNaN(t)) return 0;
	return Math.max(0, Math.floor((Date.now() - t) / 1000));
}

export function formatElapsedMmSs(totalSeconds: number): string {
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}
