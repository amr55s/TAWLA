import type { Metadata } from "next";
import LandingContent from "./LandingContent";

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
	return <LandingContent />;
}
