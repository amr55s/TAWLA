import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

export interface StatCardProps {
	title: string;
	value: string | number;
	change?: string;
	trend?: "up" | "down";
	icon: React.ElementType;
	iconBg: string;
	loading?: boolean;
}

export function StatCard({
	title,
	value,
	change,
	trend,
	icon: Icon,
	iconBg,
	loading,
}: StatCardProps) {
	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-shadow duration-300">
			<div className="flex items-start justify-between mb-4">
				<div
					className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
				>
					<Icon size={20} className="text-current" />
				</div>
				{!loading && change && (
					<div
						className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${trend === "up"
							? "bg-sky-50 text-sky-600"
							: "bg-red-50 text-red-500"
							}`}
					>
						{trend === "up" ? (
							<TrendingUp size={12} />
						) : (
							<TrendingDown size={12} />
						)}
						{change}
					</div>
				)}
			</div>
			{loading ? (
				<div className="h-8 w-24 bg-[#F0F4F8] rounded animate-pulse mb-1" />
			) : (
				<p className="text-[26px] font-bold text-[#0A1628] tracking-tight mb-1">
					{value}
				</p>
			)}
			<p className="text-xs text-[#7B8BA3] font-medium">{title}</p>
		</div>
	);
}
