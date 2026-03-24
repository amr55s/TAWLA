"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { toggleRestaurantActive } from "./actions";

export function ActiveToggle({
	restaurantId,
	initialActive,
}: {
	restaurantId: string;
	initialActive: boolean;
}) {
	const [active, setActive] = useState(initialActive);
	const [isPending, startTransition] = useTransition();

	const handleToggle = (nextActive: boolean) => {
		setActive(nextActive);
		startTransition(async () => {
			const result = await toggleRestaurantActive(restaurantId, nextActive);
			if (result?.error) {
				setActive(!nextActive); // revert
				toast.error(result.error);
			} else {
				toast.success(
					nextActive ? "Restaurant activated" : "Restaurant suspended",
				);
			}
		});
	};

	return (
		<div className="flex items-center justify-center">
			<Switch
				checked={active}
				onCheckedChange={handleToggle}
				disabled={isPending}
				size="sm"
			/>
		</div>
	);
}

