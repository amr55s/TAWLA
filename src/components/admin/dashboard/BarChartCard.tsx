import { motion } from "framer-motion";

export interface BarChartData {
	label: string;
	h: number;
	value: number;
}

export interface BarChartCardProps {
	data: BarChartData[];
	loading: boolean;
}

export function BarChartCard({ data, loading }: BarChartCardProps) {
	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Revenue Trends</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						Revenue over last 6 months
					</p>
				</div>
			</div>
			{loading ? (
				<div className="flex flex-1 items-center justify-center min-h-[180px]">
					<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
				</div>
			) : data.length === 0 || data.every((d) => d.value === 0) ? (
				<div className="flex flex-1 items-center justify-center text-sm text-[#7B8BA3] min-h-[180px]">
					No revenue data available
				</div>
			) : (
				<div className="flex items-end justify-between gap-2 h-[180px] mt-auto">
					{data.map((bar) => (
						<div
							key={bar.label}
							className="flex-1 flex flex-col items-center gap-2 group relative"
						>
							<div className="absolute -top-8 bg-[#0A1628] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
								${bar.value.toFixed(2)}
							</div>
							<motion.div
								initial={{ height: 0 }}
								animate={{ height: `${bar.h}%` }}
								transition={{ duration: 0.6, delay: 0.1 }}
								className="w-full rounded-t-md bg-gradient-to-t from-[#0F4C75] to-[#3282B8] min-h-[4px]"
							/>
							<span className="text-[9px] text-[#B0B8C4] font-medium">
								{bar.label}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
