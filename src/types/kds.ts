export type KdsOrderRow = {
	id: string;
	status: string;
	created_at: string;
	special_requests: string | null;
	table: { table_number: number } | null;
	items: Array<{
		id: string;
		quantity: number;
		special_requests: string | null;
		menu_item: { name_en: string; name_ar: string } | null;
	}>;
};

export type KDS_QUEUE_STATUS = "in_kitchen" | "ready";

export type KdsOrderStatusUpdate = "ready" | "in_kitchen";
