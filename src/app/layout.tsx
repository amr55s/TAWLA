import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import { PostHogProvider } from "@/providers/PostHogProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
	variable: "--font-plus-jakarta-sans",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

const tajawal = Tajawal({
	variable: "--font-tajawal",
	subsets: ["arabic"],
	weight: ["300", "400", "500", "700"],
	display: "swap",
});

const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Tawla - Restaurant Intelligence Platform",
	description:
		"The autonomous restaurant management platform. Smart menus, real-time operations, and intelligent analytics.",
	keywords: ["restaurant", "management", "saas", "menu", "tawla", "platform"],
	authors: [{ name: "Tawla" }],
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Tawla",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: "#0F4C75",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" dir="ltr" suppressHydrationWarning>
			<body
				suppressHydrationWarning
				className={`${plusJakartaSans.variable} ${tajawal.variable} ${playfairDisplay.variable} antialiased bg-background text-text-body min-h-screen`}
			>
				<PostHogProvider>{children}</PostHogProvider>
				<Analytics />
				<Toaster position="top-right" richColors closeButton />
			</body>
		</html>
	);
}
