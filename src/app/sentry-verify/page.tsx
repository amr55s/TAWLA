"use client";

import * as React from "react";
import { triggerSentryServerError } from "@/app/actions/sentry-test.actions";

export default function SentryVerifyPage() {
	const [serverLoading, setServerLoading] = React.useState(false);
	const [serverResult, setServerResult] = React.useState<string | null>(null);

	return (
		<main className="mx-auto w-full max-w-2xl px-6 py-12">
			<h1 className="text-2xl font-black tracking-tight text-slate-900">
				Sentry Integration Verification - Tawla Project
			</h1>
			<p className="mt-2 text-sm text-slate-600">
				Use the buttons below to trigger a client error and a server action
				error.
			</p>

			<div className="mt-8 grid gap-4">
				<button
					type="button"
					onClick={() => {
						throw new Error("Sentry Test Client Error - Tawla Project");
					}}
					className="h-12 rounded-xl bg-[#0F4C75] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0A3558] active:scale-[0.99] transition"
				>
					Trigger Client Error
				</button>

				<button
					type="button"
					disabled={serverLoading}
					onClick={async () => {
						setServerLoading(true);
						setServerResult(null);
						try {
							await triggerSentryServerError();
							setServerResult(
								"Unexpected: server action did not throw (check wiring).",
							);
						} catch (err) {
							// Server-side exception should still be captured by Sentry.
							setServerResult(
								`Caught response from server action (expected): ${
									err instanceof Error ? err.message : "Unknown error"
								}`,
							);
						} finally {
							setServerLoading(false);
						}
					}}
					className="h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60 active:scale-[0.99] transition"
				>
					{serverLoading ? "Triggering Server Error…" : "Trigger Server Action Error"}
				</button>

				{serverResult && (
					<div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
						{serverResult}
					</div>
				)}
			</div>
		</main>
	);
}

