import type { Metadata } from "next";
import LandingContent from "./LandingContent";
import { Suspense } from "react";
import Loading from "./loading";

export const metadata: Metadata = {
	title: "Tawla — Autonomous Restaurant Intelligence",
	description:
		"The fluid ecosystem that seamlessly connects your guests, waiters, and kitchen in real-time. Built with advanced agentic logic to optimize table turns.",
	keywords: [
		"restaurant",
		"management",
		"SaaS",
		"POS",
		"digital menu",
		"tawla",
		"intelligence",
	],
};

export default function HomePage() {
	return (
		<main>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "SoftwareApplication",
						"name": "Tawla",
						"operatingSystem": "Web",
						"applicationCategory": "BusinessApplication",
						"description": "Autonomous Restaurant Intelligence platform. Smart menus, real-time operations, and intelligent analytics.",
						"offers": {
							"@type": "Offer",
							"price": "0",
							"priceCurrency": "USD"
						},
						"publisher": {
							"@type": "Organization",
							"name": "Tawla",
							"logo": {
								"@type": "ImageObject",
								"url": "https://tawla.link/logo.svg"
							}
						}
					})
				}}
			/>
			<Suspense fallback={<Loading />}>
				<LandingContent />
			</Suspense>
		</main>
	);
}
