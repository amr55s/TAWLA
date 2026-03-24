import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoBrandProps {
	variant?: "primary" | "footer";
	className?: string;
	logoClassName?: string;
	href?: string;
}

export function LogoBrand({
	variant = "primary",
	className,
	logoClassName,
	href = "/",
}: LogoBrandProps) {
	const logoSrc = variant === "primary" ? "/logo.svg" : "/logofooter.svg";

	return (
		<Link
			href={href}
			className={cn(
				"flex items-center gap-2 select-none transition-transform duration-300 hover:opacity-90 active:scale-95 origin-left",
				className
			)}
		>
			<Image
				src={logoSrc}
				alt="Tawla Logo"
				width={160}
				height={40}
				className={cn("h-8 w-auto object-contain", logoClassName)}
				style={{ width: "auto" }}
				priority
				unoptimized
			/>
		</Link>
	);
}
