"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

declare global {
	interface Window {
		__POSTHOG_INITIALIZED__?: boolean;
	}
}

interface PostHogProviderProps {
	children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (window.__POSTHOG_INITIALIZED__) return;

		const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
		const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

		if (!posthogKey || !posthogHost) {
			if (process.env.NODE_ENV === "development") {
				console.warn(
					"PostHog is not initialized: missing NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST.",
				);
			}
			return;
		}

		// Prevent hanging and AbortErrors by entirely skipping tracking locally
		if (process.env.NODE_ENV === "development") {
			console.log("PostHog initialization skipped in development environment.");
			return;
		}

		posthog.init(posthogKey, {
			api_host: posthogHost,
			autocapture: true,
			capture_pageview: true,
			capture_pageleave: true,
			disable_session_recording: false,
		});

		window.__POSTHOG_INITIALIZED__ = true;
	}, []);

	return <>{children}</>;
}
