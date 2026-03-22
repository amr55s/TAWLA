import React from "react";

// Matches the Order structure from the Cashier page
interface PrintOrder {
	id: string;
	tableNumber?: string | number | null;
	items: { id: string; name: string; price: number; quantity: number }[];
	total: number;
	createdAt: Date;
}

interface ReceiptPrintProps {
	order: PrintOrder | null;
	restaurantName: string;
	cashierName?: string;
}

export function ReceiptPrint({ order, restaurantName, cashierName = "Cashier" }: ReceiptPrintProps) {
	if (!order) return null;

	return (
		<div className="hidden print:flex print:flex-col print:w-[80mm] print:mx-auto print:bg-white print:text-black print:text-sm print:font-mono bg-white text-black p-4 w-[80mm] mx-auto font-mono items-center justify-start h-auto origin-top-center">
			
			{/* Header */}
			<div className="text-center w-full flex flex-col items-center">
				<h2 className="text-xl font-bold mb-1 tracking-tight text-center">Tawla Smart Apps</h2>
				<h1 className="text-2xl font-black mb-1 uppercase tracking-wider text-center break-words leading-snug">{restaurantName}</h1>
				<p className="text-sm font-bold uppercase tracking-widest text-[#0A1628] border border-black/20 rounded-md px-3 py-1 mt-1">Simplified Tax Invoice</p>
			</div>

			<div className="w-full border-b-2 border-dashed border-black/40 my-4" />

			{/* Meta Info */}
			<div className="text-[13px] space-y-1.5 mb-2 w-full text-left font-bold">
				<div className="flex justify-between items-center">
					<span>Date:</span>
					<span>{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
				</div>
				<div className="flex justify-between items-center">
					<span>Order No:</span>
					<span>#{order.id.split("-")[0].toUpperCase()}</span>
				</div>
				<div className="flex justify-between items-center">
					<span>Type:</span>
					<span>{order.tableNumber ? `Dine-In (Table ${order.tableNumber})` : "Takeaway"}</span>
				</div>
				<div className="flex justify-between items-center">
					<span>Cashier:</span>
					<span>{cashierName}</span>
				</div>
			</div>

			<div className="w-full border-b-[3px] border-dotted border-black/40 my-3" />

			{/* Items List */}
			<div className="w-full text-sm mb-2 text-left">
				<div className="flex justify-between border-b-2 border-black/80 pb-1.5 mb-2 font-black uppercase tracking-wider text-[11px]">
					<span>Qty Item</span>
					<span>Total</span>
				</div>
				<div className="space-y-3 mt-3">
					{order.items.map((item, index) => (
						<div key={index} className="flex flex-col font-bold">
							<div className="flex justify-between items-start">
								<span className="flex-1 pr-2 leading-tight">
									<span className="inline-block w-[28px] shrink-0">{item.quantity}x</span>
									{item.name}
								</span>
								<span className="shrink-0 tracking-tight">
									{(item.quantity * item.price).toFixed(3)}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="w-full border-b-[3px] border-dotted border-black/40 my-4" />

			{/* Totals */}
			<div className="w-full space-y-1.5 text-[13px] mb-3 text-left font-bold">
				<div className="flex justify-between items-center text-black/80">
					<span>Subtotal</span>
					<span>{order.total.toFixed(3)} KD</span>
				</div>
				<div className="flex justify-between items-center text-black/80">
					<span>Tax (0%)</span>
					<span>0.000 KD</span>
				</div>
			</div>

			<div className="w-full flex justify-between items-end pt-2 pb-1 text-left bg-black text-white px-3 mt-1 rounded-sm print:bg-black print:text-white print:px-3 print:py-2 print:border-net print:print-color-adjust-exact">
				<span className="font-black text-sm uppercase tracking-widest">Grand Total</span>
				<span className="font-black text-xl tracking-tighter tabular-nums">{order.total.toFixed(3)} KD</span>
			</div>
			{/* Additional line exclusively for print media so bg-black is respected */}
			<div className="w-full flex justify-between items-end border-t-4 border-black pt-2 mb-6 text-left hidden print:hidden">
				<span className="font-black text-lg uppercase tracking-wider">Grand Total</span>
				<span className="font-black text-2xl tracking-tighter tabular-nums">{order.total.toFixed(3)} KD</span>
			</div>

			{/* Footer */}
			<div className="text-center font-bold space-y-1 mt-6 w-full pb-4">
				<p className="text-base tracking-wide">Thank you for your visit!</p>
				<p className="text-[11px] text-black/70">Tax ID: 10029384756</p>
				<div className="mt-4 pt-4 border-t border-black/20 text-center flex flex-col items-center">
					<span className="text-white bg-black rounded-lg px-2 py-0.5 text-[10px] uppercase font-black tracking-widest print-color-adjust-exact">Tawla</span>
				</div>
			</div>
		</div>
	);
}
