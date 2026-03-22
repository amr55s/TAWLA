"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface BackButtonProps {
	className?: string;
	variant?: "light" | "white";
	onClick?: () => void;
}

export function BackButton({
	className,
	variant = "light",
	onClick,
}: BackButtonProps) {
	const router = useRouter();

	const handleClick = () => {
		if (onClick) {
			onClick();
		} else {
			router.back();
		}
	};

	return (
		<motion.button
			whileTap={{ scale: 0.95 }}
			onClick={handleClick}
			className={clsx(
				"w-10 h-10 rounded-full flex items-center justify-center transition-colors",
				variant === "light" && "bg-border-light hover:bg-border-medium",
				variant === "white" &&
					"bg-white border border-border-light shadow-sm hover:bg-gray-50",
				className,
			)}
			aria-label="Go back"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="text-text-heading"
			>
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</motion.button>
	);
}
