import Link from "next/link";

export default function SlugNotFound() {
	return (
		<div
			className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8 text-center"
			suppressHydrationWarning
		>
			<div className="w-24 h-24 mb-8 bg-[#0F4C75]/10 rounded-full flex items-center justify-center">
				<span className="text-4xl">🍽️</span>
			</div>
			<h1 className="text-3xl font-bold text-[#0A1628] mb-4">
				Table Not Found
			</h1>
			<p className="text-[#64748B] max-w-sm mx-auto mb-10 text-sm leading-relaxed">
				Looks like this table is empty. The page you are looking for doesn't
				exist or is currently unavailable.
			</p>
			<Link
				href="/"
				className="px-8 py-3.5 bg-[#0F4C75] text-white text-sm font-bold rounded-xl hover:bg-[#0A3558] transition-colors shadow-sm"
			>
				Return Home
			</Link>
		</div>
	);
}
