export interface DonutSegment {
	label: string;
	pct: number;
	color: string;
}

export interface DonutChartCardProps {
	segments: DonutSegment[];
	total: number;
	loading: boolean;
}

export function DonutChartCard({ segments, total, loading }: DonutChartCardProps) {
	let gradient = "";
	if (segments.length > 0) {
		let currentPct = 0;
		const gradientStops = segments.map((seg) => {
			const start = currentPct;
			const end = currentPct + seg.pct;
			currentPct = end;
			return `${seg.color} ${start}% ${end}%`;
		});
		gradient = `conic-gradient(${gradientStops.join(", ")})`;
	} else {
		gradient = `conic-gradient(#E8ECF1 0% 100%)`;
	}

	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Order Status</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						Breakdown of all orders
					</p>
				</div>
			</div>

			{loading ? (
				<div className="flex flex-1 items-center justify-center min-h-[140px]">
					<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
				</div>
			) : total === 0 ? (
				<div className="flex flex-1 items-center justify-center text-sm text-[#7B8BA3] min-h-[140px]">
					No orders recorded
				</div>
			) : (
				<div className="flex flex-col xl:flex-row items-center gap-8 mt-auto xl:mt-2">
					<div className="relative w-[140px] h-[140px] shrink-0">
						<div
							className="w-full h-full rounded-full"
							style={{ background: gradient }}
						/>
						<div className="absolute inset-[25%] rounded-full bg-white flex items-center justify-center shadow-inner">
							<div className="text-center">
								<p className="text-lg font-bold text-[#0A1628]">{total}</p>
								<p className="text-[9px] text-[#7B8BA3] font-medium uppercase tracking-wider">
									Total
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-3 flex-1 w-full">
						{segments.map((seg) => (
							<div
								key={seg.label}
								className="flex items-center justify-between"
							>
								<div className="flex items-center gap-2.5">
									<div
										className="w-2.5 h-2.5 rounded-full shadow-sm"
										style={{ background: seg.color }}
									/>
									<span className="text-xs text-[#5A6B82] font-medium capitalize">
										{seg.label}
									</span>
								</div>
								<span className="text-xs font-bold text-[#0A1628]">
									{seg.pct}%
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
