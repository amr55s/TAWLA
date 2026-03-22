"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	ClipboardList,
	UtensilsCrossed,
	Settings,
	Users,
} from "lucide-react";
import { StaffLayout, NavigationItem } from "@/components/layout/StaffLayout";

export default function StaffRouteLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams();
	const router = useRouter();
	const slug = params.slug as string;
	const basePath = `/${slug}/admin`; // or cashier/waiter depending on context

	// Mock dynamic navigation depending on role
	const navigation: NavigationItem[] = [
		{ name: "Dashboard", href: basePath, icon: LayoutDashboard },
		{ name: "Orders", href: `${basePath}/orders`, icon: ClipboardList },
		{ name: "Menu", href: `${basePath}/menu`, icon: UtensilsCrossed },
		{ name: "Staff", href: `${basePath}/staff`, icon: Users },
		{ name: "Settings", href: `${basePath}/settings`, icon: Settings },
	];

	const handleSignOut = () => {
		// e.g. await supabase.auth.signOut()
		console.log("Signing out user...");
		router.push("/");
	};

	return (
		<StaffLayout
			navigation={navigation}
			brandName="Tawla"
			roleName="Administrator"
			userName="Admin User"
			userInitials="AD"
			onSignOut={handleSignOut}
		>
			{children}
		</StaffLayout>
	);
}
