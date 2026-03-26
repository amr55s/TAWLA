import Link from "next/link";
import { Building2, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { LogoBrand } from "@/components/ui/LogoBrand";

const navItems = [
	{ href: "/super-admin#overview", label: "Overview", icon: LayoutDashboard },
	{ href: "/super-admin#restaurants", label: "Restaurants", icon: Building2 },
];

export function SuperAdminSidebar() {
	return (
		<aside className="hidden w-[280px] shrink-0 flex-col border-r border-[#D6E4F0] bg-white/90 px-6 py-8 backdrop-blur xl:flex">
			<div className="space-y-8">
				<div className="space-y-4">
					<LogoBrand variant="primary" href="/" />
					<div className="rounded-[30px] border border-[#D6E4F0] bg-[#F7FBFE] p-5">
						<div className="inline-flex items-center gap-2 rounded-full border border-[#BBE1FA] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0F4C75]">
							<ShieldCheck size={14} />
							Super Admin
						</div>
						<h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0A1628]">
							Platform Control Tower
						</h2>
						<p className="mt-2 text-sm leading-6 text-[#5B6B82]">
							Review every restaurant, correct subscription states manually, and
							keep billing recovery paths reachable.
						</p>
					</div>
				</div>

				<nav className="space-y-2">
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center gap-3 rounded-full border border-transparent px-4 py-3 text-sm font-semibold text-[#3D4F6F] transition-colors hover:border-[#D6E4F0] hover:bg-[#F7FBFE] hover:text-[#0F4C75]"
							>
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF4FB] text-[#0F4C75]">
									<Icon size={16} />
								</div>
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className="rounded-[30px] bg-[#0F4C75] p-5 text-white shadow-[0_24px_80px_rgba(15,76,117,0.18)]">
					<div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#BBE1FA]">
						<Sparkles size={14} />
						Safety Rail
					</div>
					<p className="mt-3 text-sm leading-6 text-white/80">
						Manual overrides update billing dates without touching the public
						subscribe flow, so expired accounts can still recover cleanly.
					</p>
				</div>
			</div>
		</aside>
	);
}
