import Image from "next/image";

export default function Loading() {
	return (
		<div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
			<div className="flex flex-col items-center">
				{/* Logo Area */}
				<div className="mb-10 animate-pulse duration-2000">
					<Image
						src="/logo.svg"
						alt="Tawla Logo"
						width={160}
						height={40}
						className="h-12 w-auto object-contain"
						priority
					/>
				</div>

				{/* Loading Spinner */}
				<div className="relative flex items-center justify-center mb-8">
					<div className="absolute w-12 h-12 rounded-full border-[3px] border-tawla-sky/20" />
					<div className="w-12 h-12 rounded-full border-[3px] border-transparent border-t-tawla-deep border-r-tawla-deep/50 animate-spin" />
				</div>

				{/* Loading Text */}
				<div className="flex flex-col items-center gap-2">
					<p className="text-[11px] font-semibold text-tawla-deep/80 tracking-[0.2em] uppercase">
						Initializing Tawla...
					</p>
					<p className="text-[12px] font-medium text-tawla-deep/60" dir="rtl">
						جاري تحميل طاولة...
					</p>
				</div>
			</div>
		</div>
	);
}
