"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				<span className="sr-only">Toggle theme</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="rounded-xl">
				<DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer rounded-lg">
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer rounded-lg">
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer rounded-lg">
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
