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
		<header className="sticky top-0 z-40 mb-8 flex items-center justify-between gap-4 rounded-[30px] border border-[#D6E4F0] bg-white/90 px-5 py-4 shadow-[0_18px_60px_rgba(15,76,117,0.08)] backdrop-blur">
			<div className="flex items-center gap-3">
				<div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF4FB] text-[#0F4C75]">
					<ShieldCheck size={18} />
				</div>
				<div>
					<h1 className="text-lg font-bold tracking-tight text-[#0A1628]">
						Super Admin Dashboard
					</h1>
					<p className="text-xs font-medium text-[#7B8BA3]">
						Private control tower for restaurants and subscription overrides
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<div className="hidden rounded-full border border-[#D6E4F0] bg-[#FCFEFF] px-4 py-2 text-xs font-semibold text-[#3D4F6F] md:block">
					{email}
				</div>
				<button
					onClick={handleLogout}
					className="inline-flex items-center gap-2 rounded-full border border-[#D6E4F0] bg-white px-4 py-2 text-sm font-semibold text-[#3D4F6F] transition-colors hover:border-[#0F4C75]/20 hover:bg-[#F7FBFE] hover:text-[#0F4C75]"
				>
					<LogOut size={14} />
					Logout
				</button>
			</div>
		</header>
	);
}
