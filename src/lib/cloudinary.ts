/**
 * Injects `f_auto,q_auto` after `/upload/` for Cloudinary delivery optimization.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function getOptimizedImageUrl(url: string): string {
	if (!url || !url.includes("res.cloudinary.com")) {
		return url;
	}
	if (url.includes("f_auto,q_auto") || url.includes("f_auto%2Cq_auto")) {
		return url;
	}
	const marker = "/upload/";
	const i = url.indexOf(marker);
	if (i === -1) {
		return url;
	}
	const after = url.slice(i + marker.length);
	return `${url.slice(0, i + marker.length)}f_auto,q_auto/${after}`;
}
