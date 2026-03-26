"use client";

import { clsx } from "clsx";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getOptimizedImageUrl } from "@/lib/cloudinary";

interface MenuItemImageProps {
	src: string | null | undefined;
	alt: string;
	fill?: boolean;
	sizes?: string;
	className?: string;
	priority?: boolean;
}

function Placeholder() {
	return (
		<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="28"
				height="28"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="text-primary/40"
			>
				<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
				<path d="M7 2v20" />
				<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
			</svg>
		</div>
	);
}

export function MenuItemImage({
	src,
	alt,
	fill = true,
	sizes,
	className,
	priority = false,
}: MenuItemImageProps) {
	const [hasError, setHasError] = useState(false);
	const displaySrc = useMemo(
		() => (src?.trim() ? getOptimizedImageUrl(src.trim()) : ""),
		[src],
	);

	useEffect(() => {
		// Reset error state whenever the image source changes
		setHasError(false);
	}, [src]);

	if (!displaySrc || hasError) {
		return <Placeholder />;
	}

	return (
		<Image
			src={displaySrc}
			alt={alt}
			fill={fill}
			sizes={sizes}
			priority={priority}
			unoptimized={true}
			onError={() => setHasError(true)}
			className={clsx("object-cover", className)}
		/>
	);
}