import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Geist } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
	variable: "--font-plus-jakarta-sans",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

const dinNext = localFont({
	src: [
		{ path: "../../public/fonts/DINNextLTArabic-Light.woff2", weight: "300", style: "normal" },
		{ path: "../../public/fonts/DINNextLTArabic-Regular.woff2", weight: "400", style: "normal" },
		{ path: "../../public/fonts/DINNextLTArabic-Medium.woff2", weight: "500", style: "normal" },
		{ path: "../../public/fonts/DINNextLTArabic-Bold.woff2", weight: "700", style: "normal" },
	],
	variable: "--font-din-next",
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
	icons: {
		icon: "/favicon.svg",
		shortcut: "/favicon.svg",
		apple: "/favicon.svg",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Tawla",
	},
	other: {
		"spaceremit-verification": "8VBGII17A1IG807E2TJ05HB3X6R6UUALMLIT9ZTIJ1KROIAQ2H",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: "#0F4C75",
};

import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" dir="ltr" suppressHydrationWarning>
			<body
				suppressHydrationWarning
				className={`${geistSans.variable} ${plusJakartaSans.variable} ${dinNext.variable} ${playfairDisplay.variable} font-sans bg-background text-foreground antialiased min-h-screen transition-colors duration-200`}
			>
				<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
				<TooltipProvider>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
						<ReactQueryProvider>
							<PostHogProvider>{children}</PostHogProvider>
							<Analytics />
							<Toaster position="top-right" closeButton />
						</ReactQueryProvider>
					</ThemeProvider>
				</TooltipProvider>
			</body>
		</html>
	);
}
