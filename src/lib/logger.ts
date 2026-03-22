/**
 * A centralized logging utility to replace silent console.errors.
 * In the future, this easily wraps PostHog, Sentry, or Datadog without changing component code.
 */

// If you have standard error typings, you can import them here.
import posthog from "posthog-js";

export const logger = {
	error: (message: string, error?: any, context?: Record<string, any>) => {
		console.error(`[ERROR] ${message}`, error || "");
		
		try {
			// Safely push to PostHog if available
			posthog.capture("client_error", {
				error_message: message,
				error_details: error instanceof Error ? error.message : String(error),
				...context
			});
		} catch (e) {
			// Ignore analytics failure
		}
	},
	warn: (message: string, context?: Record<string, any>) => {
		console.warn(`[WARN] ${message}`, context || "");
	},
	info: (message: string, context?: Record<string, any>) => {
		console.info(`[INFO] ${message}`, context || "");
	}
};
