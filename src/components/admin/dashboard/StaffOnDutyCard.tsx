import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface StaffMember {
	id: string;
	name: string;
	role: string;
	is_active: boolean; // Keep for fallback or direct manual toggles
	last_active_at?: string | null;
}

export interface StaffOnDutyCardProps {
	staff: StaffMember[];
	loading: boolean;
	slug: string;
}

function getStaffStatus(member: StaffMember) {
	let status: "active" | "idle" | "offline" = "offline";
	let displayLabel = "Offline";
	let colorCls = "bg-gray-400";
	let textCls = "text-gray-600";
	let bgCls = "bg-gray-50";

	if (member.last_active_at) {
		const diff = Date.now() - new Date(member.last_active_at).getTime();
		const minutesAgo = Math.max(0, Math.floor(diff / 60000));

		if (minutesAgo <= 15) {
			status = "active";
			displayLabel = "Active Now";
			colorCls = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
			textCls = "text-emerald-700";
			bgCls = "bg-emerald-50/50";
		} else if (minutesAgo <= 45) {
			status = "idle";
			displayLabel = `Away (${minutesAgo}m)`;
			colorCls = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
			textCls = "text-amber-700";
			bgCls = "bg-amber-50/50";
		} else {
			status = "offline";
			displayLabel = `Seen ${minutesAgo > 60 ? Math.floor(minutesAgo / 60) + "h ago" : minutesAgo + "m ago"}`;
			colorCls = "bg-gray-400";
			textCls = "text-gray-500";
			bgCls = "bg-gray-50/50";
		}
	} else if (member.is_active) {
		status = "active"; // fallback
		displayLabel = "Active Now";
		colorCls = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
		textCls = "text-emerald-700";
		bgCls = "bg-emerald-50/50";
	}

	return { status, displayLabel, colorCls, textCls, bgCls };
}

export function StaffOnDutyCard({ staff, loading, slug }: StaffOnDutyCardProps) {
	// Reorder staff: Active first, then Idle, then Offline.
	const enhancedStaff = staff.map((s) => ({
		...s,
		presence: getStaffStatus(s),
	}));

	enhancedStaff.sort((a, b) => {
		const rank = { active: 1, idle: 2, offline: 3 };
		if (rank[a.presence.status] !== rank[b.presence.status]) {
			return rank[a.presence.status] - rank[b.presence.status];
		}
		return a.name.localeCompare(b.name);
	});

	const activeCount = enhancedStaff.filter((s) => s.presence.status === "active").length;

	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Staff Presence</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						{activeCount} active now
					</p>
				</div>
				<Link
					href={`/${slug}/admin/staff`}
					className="flex items-center gap-1.5 text-xs font-semibold text-[#3282B8] hover:text-[#0F4C75] transition-colors"
				>
					Manage <ArrowUpRight size={13} />
				</Link>
			</div>

			<div className="space-y-3 flex-1 min-h-[200px]">
				{loading ? (
					<div className="flex h-full items-center justify-center p-8">
						<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
					</div>
				) : enhancedStaff.length === 0 ? (
					<div className="flex h-full items-center justify-center p-8 text-center text-sm text-[#7B8BA3]">
						No staff found
					</div>
				) : (
					enhancedStaff.map((s) => (
						<div
							key={s.id}
							className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${s.presence.bgCls} hover:bg-[#F0F4F8]`}
						>
							<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F4C75]/10 to-[#3282B8]/10 flex items-center justify-center relative shadow-sm">
								<span className="text-xs font-bold text-[#0F4C75]">
									{s.name.charAt(0)}
								</span>
								<div 
									className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${s.presence.colorCls}`} 
								/>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-semibold text-[#0A1628] truncate">{s.name}</p>
								<p className="text-[10px] text-[#7B8BA3] capitalize truncate">
									{s.role}
								</p>
							</div>
							<div className="flex items-center">
								<span className={`text-[10px] font-semibold ${s.presence.textCls} bg-white/60 px-2 py-0.5 rounded-md`}>
									{s.presence.displayLabel}
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
