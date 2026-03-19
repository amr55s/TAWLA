"use client";

import { clsx } from "clsx";

interface PageHeaderProps {
	left?: React.ReactNode;
	center?: React.ReactNode;
	right?: React.ReactNode;
	title?: string;
	transparent?: boolean;
	className?: string;
}

export function PageHeader({
	left,
	center,
	right,
	title,
	transparent = false,
	className,
}: PageHeaderProps) {
	return (
		<header
			className={clsx(
				"sticky top-0 z-50 flex items-center justify-between px-6 py-4",
				!transparent && "glass-strong",
				className,
			)}
		>
			<div className="flex-shrink-0 w-10">{left}</div>

			<div className="flex-1 flex justify-center">
				{center ||
					(title && (
						<h1 className="text-lg font-bold text-text-heading tracking-tight">
							{title}
						</h1>
					))}
			</div>

			<div className="flex-shrink-0 w-10 flex justify-end">{right}</div>
		</header>
	);
}
