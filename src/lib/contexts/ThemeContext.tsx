"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme>("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const savedTheme = localStorage.getItem("tawla-theme") as Theme | null;
		if (savedTheme) {
			setTheme(savedTheme);
			if (savedTheme === "dark") document.documentElement.classList.add("dark");
		} else {
			// Explicitly default to light mode if nothing is saved
			setTheme("light");
			document.documentElement.classList.remove("dark");
		}
	}, []);

	const updateTheme = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem("tawla-theme", newTheme);
		if (newTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	if (!mounted) {
		return <>{children}</>;
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
