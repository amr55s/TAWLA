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
							<Toaster
								position="top-center"
								visibleToasts={1}
								duration={3500}
								toastOptions={{
									unstyled: true,
									classNames: {
										toast: "group flex items-center gap-3 w-[350px] max-w-[90vw] p-4 bg-white border border-gray-100 shadow-[0_20px_40px_-15px_rgba(15,76,117,0.15)] rounded-2xl transition-all",
										title: "text-[#0F4C75] font-black text-[15px] leading-tight",
										description: "text-slate-500 text-sm font-medium mt-0.5",
										icon: "text-[#0F4C75] w-6 h-6 flex-shrink-0 animate-in zoom-in-50 duration-300",
										actionButton: "bg-[#0F4C75] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95 hover:bg-[#0A3558]",
										cancelButton: "bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors",
										error: "border-l-4 border-l-red-500", // Optional accent for errors
										success: "border-l-4 border-l-[#3282B8]", // Tawla Sky Blue accent for success
									},
								}}
							/>
						</ReactQueryProvider>
					</ThemeProvider>
				</TooltipProvider>
			</body>
		</html>
	);
}
