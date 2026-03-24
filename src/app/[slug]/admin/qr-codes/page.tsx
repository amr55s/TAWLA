"use client";

import { Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";

interface Table {
	id: string;
	table_number: number;
}

export default function QRCodesPage() {
	const { restaurantId, slug, loading: ctxLoading } = useRestaurant();
	const [tables, setTables] = useState<Table[]>([]);
	const [loading, setLoading] = useState(true);
	const qrRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (!restaurantId) return;
		const fetchTables = async () => {
			const supabase = createClient();
			const { data } = await supabase
				.from("tables")
				.select("id, table_number")
				.eq("restaurant_id", restaurantId)
				.order("table_number", { ascending: true });
			setTables(data || []);
			setLoading(false);
		};
		fetchTables();
	}, [restaurantId]);

	const getMenuUrl = useCallback(
		(tableNumber: number) => {
			const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tawla.link";
			return `${baseUrl}/${slug}?table=${tableNumber}`;
		},
		[slug],
	);

	const handleDownload = useCallback((tableNumber: number) => {
		const container = qrRefs.current[`table-${tableNumber}`];
		if (!container) return;

		const svgEl = container.querySelector("svg");
		if (!svgEl) return;

		const svgData = new XMLSerializer().serializeToString(svgEl);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		img.onload = () => {
			canvas.width = 512;
			canvas.height = 512;
			if (ctx) {
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, 512, 512);
				ctx.drawImage(img, 0, 0, 512, 512);
			}
			const url = canvas.toDataURL("image/png");
			const a = document.createElement("a");
			a.download = `tawla-table-${tableNumber}-qr.png`;
			a.href = url;
			a.click();
		};

		img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
	}, []);

	if (ctxLoading || loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full" />
			</div>
		);
	}

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-[#0A1628] tracking-tight flex items-center gap-2">
						<QrCode size={20} className="text-[#3282B8]" />
						QR Codes
					</h1>
					<p className="text-xs text-[#7B8BA3] mt-1">
						Print these codes and place them on each table. Customers scan to
						view your menu.
					</p>
				</div>
			</div>

			{tables.length === 0 ? (
				<div className="bg-white rounded-2xl border border-[#E8ECF1] p-12 text-center">
					<QrCode size={40} className="text-[#B0B8C4] mx-auto mb-3" />
					<p className="text-sm text-[#7B8BA3]">
						No tables found. Add tables in Settings to generate QR codes.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
					{tables.map((table) => (
						<div
							key={table.id}
							className="bg-white rounded-2xl border border-[#E8ECF1] p-5 flex flex-col items-center gap-4 hover:shadow-md transition-shadow"
						>
							{/* Table label */}
							<div className="text-center">
								<span className="text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-widest">
									Table
								</span>
								<p className="text-2xl font-bold text-[#0A1628]">
									{table.table_number}
								</p>
							</div>

							{/* QR Code */}
							<div
								ref={(el) => {
									qrRefs.current[`table-${table.table_number}`] = el;
								}}
								className="bg-white p-2 rounded-xl"
							>
								<QRCodeSVG
									value={getMenuUrl(table.table_number)}
									size={140}
									level="M"
									bgColor="#ffffff"
									fgColor="#0A1628"
								/>
							</div>

							{/* URL preview */}
							<p className="text-[10px] text-[#B0B8C4] text-center font-mono break-all leading-relaxed">
								{getMenuUrl(table.table_number)}
							</p>

							{/* Download button */}
							<button
								onClick={() => handleDownload(table.table_number)}
								className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F5F7FA] hover:bg-[#E8ECF1] text-[#0A1628] text-xs font-semibold transition-colors"
							>
								<Download size={14} />
								Download PNG
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
