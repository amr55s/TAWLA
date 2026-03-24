"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { LogoBrand } from "@/components/ui/LogoBrand";

export interface NavigationItem {
	name: string;
	href: string;
	icon: React.ElementType;
}

interface StaffLayoutProps {
	children: React.ReactNode;
	navigation: NavigationItem[];
	brandName?: string;
	roleName?: string;
	userName?: string;
	userInitials?: string;
	userAvatar?: string;
	onSignOut?: () => void;
}

export function StaffLayout({
	children,
	navigation,
	brandName = "Tawla",
	roleName = "Staff",
	userName = "User",
	userInitials = "U",
	userAvatar,
	onSignOut,
}: StaffLayoutProps) {
	const pathname = usePathname();

	const isItemActive = (href: string) => {
		if (href.endsWith("/admin") || href.endsWith("/cashier") || href.endsWith("/waiter")) {
			return pathname === href;
		}
		return pathname.startsWith(href);
	};

	const SidebarNav = ({ isMobile = false }: { isMobile?: boolean }) => (
		<nav className="flex flex-col gap-1 w-full">
			<div className="px-4 py-2 mb-2">
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
					Navigation
				</p>
			</div>
			{navigation.map((item) => {
				const active = isItemActive(item.href);
				const Icon = item.icon;
				
				return (
					<Link key={item.href} href={item.href}>
						<span
							className={cn(
								"flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 group",
								active
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
							)}
						>
							<Icon
								className={cn("w-5 h-5", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")}
								strokeWidth={active ? 2 : 1.5}
							/>
							{item.name}
						</span>
					</Link>
				);
			})}
		</nav>
	);

	return (
		<div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
			{/* Desktop Sidebar */}
			<aside className="hidden lg:flex w-[260px] flex-col border-r border-border bg-card/30 backdrop-blur-xl shrink-0">
				<div className="flex h-16 items-center px-6">
					<LogoBrand variant="primary" logoClassName="h-6" className="outline-none ring-ring focus-visible:ring-2 rounded-lg" />
				</div>
				<div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
					<SidebarNav />
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col min-w-0">
				{/* Top Header */}
				<header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-xl">
					<div className="flex items-center gap-4">
						{/* Mobile Menu */}
						<Sheet>
							<SheetTrigger className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								<Menu className="w-5 h-5" />
								<span className="sr-only">Toggle Sidebar</span>
							</SheetTrigger>
							<SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-card/95 backdrop-blur-xl border-border">
								<SheetTitle className="sr-only">Navigation Menu</SheetTitle>
								<div className="flex h-16 items-center px-6 border-b border-border">
									<LogoBrand variant="primary" logoClassName="h-6" />
								</div>
								<div className="flex-1 overflow-y-auto py-4">
									<SidebarNav isMobile />
								</div>
							</SheetContent>
						</Sheet>
					</div>

					<div className="flex items-center gap-2 md:gap-4">
						{/* Theme Toggle */}
						<ThemeToggle />

						{/* User Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger className="relative h-10 w-10 rounded-full outline-none ring-ring focus-visible:ring-2 hover:bg-accent transition-colors">
								<Avatar className="h-10 w-10 border border-border">
									<AvatarImage src={userAvatar} alt={userName} />
									<AvatarFallback className="bg-primary/10 text-primary font-semibold">
										{userInitials}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56 rounded-xl" align="end">
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">{userName}</p>
										<p className="text-xs leading-none text-muted-foreground">{roleName}</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="rounded-lg cursor-pointer" onClick={onSignOut}>
									<LogOut className="mr-2 h-4 w-4 text-destructive" />
									<span className="text-destructive font-medium">Log out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-y-auto bg-background/50 p-4 md:p-6 lg:p-8">
					{children}
				</main>
			</div>
		</div>
	);
}
