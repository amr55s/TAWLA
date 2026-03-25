import type { Metadata } from "next";
import { KdsBoardClient } from "./KdsBoardClient";

export const metadata: Metadata = {
	title: "Kitchen Display",
	description: "Kitchen display queue for the restaurant.",
};

export default async function KdsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <KdsBoardClient slug={slug} />;
}
