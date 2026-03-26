"use server";

export async function triggerSentryServerError(): Promise<void> {
	throw new Error("Sentry Test Server Error - Tawla Project");
}

