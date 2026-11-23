import type { PricesQuery } from "@hpc/contracts";
import { useMemo, useState } from "react";
import { usePrices, useSettings, useUpdatePrice } from "../client";
import { getDefaultRoomId, getRoomDays } from "./selectors";

export interface UsePricingCalendarOptions extends PricesQuery {
	roomId?: string;
}

export function usePricingCalendar(options: UsePricingCalendarOptions) {
	const settings = useSettings();
	const prices = usePrices({
		from: options.from,
		to: options.to,
		rooms: options.rooms,
	});
	const updatePrice = useUpdatePrice();
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
		options.roomId ?? null,
	);
	const activeRoomId =
		selectedRoomId ?? options.roomId ?? getDefaultRoomId(settings.data);
	const days = useMemo(
		() => getRoomDays(prices.data, activeRoomId),
		[prices.data, activeRoomId],
	);

	return {
		settings,
		prices,
		rooms: settings.data?.rooms ?? [],
		activeRoomId,
		selectedRoomId,
		setSelectedRoomId,
		days,
		updatePrice,
	};
}
