"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SuperAdminHeader({ email }: { email: string }) {
	const router = useRouter();

	const handleLogout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login");
	};

	return (
		<header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1120]/80 backdrop-blur-xl">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				{/* Branding */}
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
						<ShieldCheck size={18} className="text-white" />
					</div>
					<div>
						<h1 className="text-sm font-bold text-white tracking-tight leading-none">
							Super Admin
						</h1>
						<p className="text-[10px] text-white/40 font-medium tracking-wider uppercase mt-0.5">
							Platform Control
						</p>
					</div>
				</div>

				{/* Right */}
				<div className="flex items-center gap-4">
					<span className="hidden sm:block text-xs text-white/50 font-medium">
						{email}
					</span>
					<button
						onClick={handleLogout}
						className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
					>
						<LogOut size={14} />
						<span className="hidden sm:inline">Logout</span>
					</button>
				</div>
			</div>
		</header>
	);
}
