import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles, Store, Zap, Crown } from "lucide-react";
import { PLAN_CATALOG } from "@/lib/billing/plans";

const PAYWALL_PLANS = [
	{
		id: "starter" as const,
		icon: Store,
		accent: "from-[#0F4C75] to-[#3282B8]",
		eyebrow: "Lean Setup",
		copy: "Best for compact cafes and smaller dine-in floors.",
	},
	{
		id: "pro" as const,
		icon: Zap,
		accent: "from-[#C17B2C] to-[#E1A64F]",
		eyebrow: "Growth Engine",
		copy: "Built for busy single-branch restaurants ready to systemize service.",
	},
	{
		id: "enterprise" as const,
		icon: Crown,
		accent: "from-[#0A1628] to-[#355070]",
		eyebrow: "Branch Command",
		copy: "Multi-branch control, master analytics, and serious operating volume.",
	},
] as const;

export function SubscriptionHardStopView({
	slug,
	title = "Subscription Expired",
	description = "Admin access and ordering are frozen until billing is restored. Choose a plan to unlock the restaurant again.",
}: {
	slug: string;
	title?: string;
	description?: string;
}) {
	return (
		<div className="min-h-full bg-[#F6F1E8] text-[#101828]">
			<div
				className="absolute inset-0 opacity-60"
				style={{
					background:
						"radial-gradient(circle at top left, rgba(193,123,44,0.16), transparent 30%), radial-gradient(circle at top right, rgba(15,76,117,0.18), transparent 28%), linear-gradient(135deg, rgba(16,24,40,0.02), rgba(16,24,40,0.05))",
				}}
			/>

			<div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
				<div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
					<section className="rounded-[32px] border border-[#101828]/10 bg-[#FFF9F2] p-8 shadow-[0_20px_80px_rgba(16,24,40,0.08)] lg:p-10">
						<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C17B2C]/20 bg-[#C17B2C]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-[#8B5E1A]">
							<Sparkles size={14} />
							Hard Stop Active
						</div>

						<h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.04em] text-[#101828] sm:text-5xl lg:text-6xl">
							<span className="block text-[#0F4C75]">{title}</span>
							<span className="block">Restore Tawla Access</span>
						</h1>

						<p className="mt-6 max-w-xl text-base leading-7 text-[#465467] sm:text-lg">
							{description}
						</p>

						<div className="mt-8 grid gap-4 sm:grid-cols-2">
							<div className="rounded-3xl border border-[#101828]/8 bg-white p-5">
								<div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#7A8797]">
									<LockKeyhole size={14} />
									What Is Frozen
								</div>
								<p className="text-xl font-black tracking-[-0.03em] text-[#101828]">
									Admin dashboard, menu ordering, and checkout progression
								</p>
							</div>

							<div className="rounded-3xl border border-[#101828]/8 bg-[#101828] p-5 text-white">
								<p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
									Recovery Path
								</p>
								<p className="mt-3 text-xl font-black tracking-[-0.03em]">
									Choose a plan below to reopen operations immediately
								</p>
							</div>
						</div>

						<div className="mt-8">
							<Link
								href={`/${slug}/admin/settings/billing`}
								className="inline-flex items-center gap-2 rounded-full border border-[#0F4C75]/15 bg-white px-5 py-3 text-sm font-black text-[#0F4C75] transition-colors hover:bg-[#F7FBFE]"
							>
								Review Billing Status
								<ArrowRight size={15} />
							</Link>
						</div>
					</section>

					<section className="grid gap-5">
						{PAYWALL_PLANS.map((entry) => {
							const plan = PLAN_CATALOG[entry.id];
							const Icon = entry.icon;
							const recommended = entry.id === "pro";

							return (
								<div
									key={plan.id}
									className={`relative overflow-hidden rounded-[30px] border p-6 shadow-[0_16px_60px_rgba(16,24,40,0.08)] ${
										recommended
											? "border-[#C17B2C]/30 bg-[#FFF6E8]"
											: "border-[#101828]/10 bg-white"
									}`}
								>
									<div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r opacity-90 ${entry.accent}`} />
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7A8797]">
												{entry.eyebrow}
											</p>
											<h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#101828]">
												{plan.label}
											</h2>
										</div>
										<div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${entry.accent}`}>
											<Icon size={22} />
										</div>
									</div>

									<div className="mt-5 flex items-end gap-3">
										<div className="text-5xl font-black tracking-[-0.05em] text-[#101828]">
											${plan.monthlyPriceUsd}
										</div>
										<div className="pb-1 text-sm font-semibold text-[#667085]">
											≈ {plan.monthlyPriceEgp.toLocaleString("en-US")} EGP / month
										</div>
									</div>

									<p className="mt-4 text-sm leading-6 text-[#5B6472]">
										{entry.copy}
									</p>

									<div className="mt-5 grid gap-2 text-sm text-[#101828]">
										{plan.features.map((feature) => (
											<div
												key={feature}
												className="flex items-center gap-2 rounded-2xl bg-[#F8FAFC] px-3 py-2"
											>
												<div className="h-2 w-2 rounded-full bg-[#0F4C75]" />
												<span>{feature}</span>
											</div>
										))}
									</div>

									<div className="mt-6">
										<Link
											href={`/${slug}/admin/settings/checkout?plan=${plan.id}`}
											className={`inline-flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-transform hover:-translate-y-0.5 ${
												recommended
													? "bg-[#101828] text-white"
													: "bg-[#0F4C75] text-white"
											}`}
										>
											<span>Choose {plan.label}</span>
											<ArrowRight size={16} />
										</Link>
									</div>

									{recommended && (
										<div className="absolute right-5 top-5 rounded-full bg-[#101828] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
											Most Balanced
										</div>
									)}
								</div>
							);
						})}
					</section>
				</div>
			</div>
		</div>
	);
}
