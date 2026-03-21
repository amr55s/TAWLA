"use client";

import { BarChart3, Sparkles, TrendingUp } from "lucide-react";

export default function AdminAnalyticsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-bold text-[#0A1628] dark:text-white tracking-tight">
					Analytics
				</h1>
				<p className="text-xs text-[#7B8BA3] mt-1">
					Track performance and insights
				</p>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8ECF1] dark:border-gray-700 p-12 text-center">
				<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F4C75]/10 to-[#3282B8]/10 flex items-center justify-center mx-auto mb-5">
					<BarChart3 size={28} className="text-[#3282B8]" />
				</div>
				<h2 className="text-lg font-bold text-[#0A1628] dark:text-white mb-2">
					Analytics Coming Soon
				</h2>
				<p className="text-sm text-[#7B8BA3] max-w-md mx-auto mb-6">
					We're building powerful analytics dashboards with revenue trends, peak
					hour analysis, top-selling items, and staff performance metrics.
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
					{[
						{ icon: TrendingUp, label: "Revenue Trends" },
						{ icon: BarChart3, label: "Peak Hours" },
						{ icon: Sparkles, label: "AI Insights" },
					].map((f) => (
						<div
							key={f.label}
							className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F8FAFB] border border-[#E8ECF1]"
						>
							<f.icon size={18} className="text-[#3282B8]" />
							<span className="text-[10px] font-semibold text-[#5A6B82] uppercase tracking-wider">
								{f.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
