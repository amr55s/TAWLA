import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface RecentOrder {
	id: string;
	order_number?: string;
	total_amount: number;
	status: string;
	tables?: { table_number: number } | null;
}

export interface RecentOrdersCardProps {
	orders: RecentOrder[];
	loading: boolean;
	slug: string;
}

export function RecentOrdersCard({ orders, loading, slug }: RecentOrdersCardProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-gray-50 text-[#5A6B82]";
			case "completed":
				return "bg-blue-50 text-[#3282B8]";
			case "served":
				return "bg-sky-50 text-sky-600";
			default:
				return "bg-amber-50 text-amber-600";
		}
	};

	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Recent Orders</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						Latest activity across tables
					</p>
				</div>
				<Link
					href={`/${slug}/admin/orders`}
					className="flex items-center gap-1.5 text-xs font-semibold text-[#3282B8] hover:text-[#0F4C75] transition-colors"
				>
					View All <ArrowUpRight size={13} />
				</Link>
			</div>

			<div className="overflow-x-auto flex-1 min-h-[200px]">
				{loading ? (
					<div className="flex h-full items-center justify-center p-8">
						<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
					</div>
				) : orders.length === 0 ? (
					<div className="flex h-full items-center justify-center p-8 text-center text-sm text-[#7B8BA3]">
						No recent orders
					</div>
				) : (
					<table className="w-full">
						<thead>
							<tr className="border-b border-[#F0F4F8]">
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Order
								</th>
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Table
								</th>
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Total
								</th>
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr
									key={o.id}
									className="border-b border-[#F8FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors"
								>
									<td className="py-3 text-xs font-bold text-[#0A1628]">
										#{o.order_number || o.id.slice(0, 4)}
									</td>
									<td className="py-3 text-xs text-[#5A6B82] font-medium">
										{o.tables?.table_number
											? `T-${o.tables.table_number}`
											: "Takeaway"}
									</td>
									<td className="py-3 text-xs font-semibold text-[#0A1628]">
										${Number(o.total_amount).toFixed(2)}
									</td>
									<td className="py-3">
										<span
											className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(o.status)} capitalize`}
										>
											{o.status.replace("_", " ")}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
