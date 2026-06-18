import { getPrices } from "@/services/hotel-api/prices";
import type { DayPriceItem, PriceData } from "@/types/Pricing";
import { getDateMetadata, isSameMonthAndYear } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";

interface UsePricesFilters {
	locale: string;
	selectedRoomId: string | null;
	currentMonthDate: Date;
	timezone?: string;
}

export const usePrices = (filters: UsePricesFilters) => {
	const {
		locale,
		selectedRoomId,
		currentMonthDate,
		timezone = undefined,
	} = filters;

	return useQuery<PriceData, Error, DayPriceItem[] | null>({
		queryKey: [
			"prices",
			locale,
			selectedRoomId,
			currentMonthDate.getFullYear(),
			currentMonthDate.getMonth(),
			timezone,
		],
		queryFn: ({ signal }) => getPrices(signal),
		retry: 2,
		refetchOnWindowFocus: false,
		enabled: !!selectedRoomId,
		select: (rawData) => {
			if (!rawData || !selectedRoomId) return null;

			const dataEntries = Object.entries(rawData.prices.data);
			const currencySymbol = rawData.currency.symbol;

			return dataEntries
				.filter(([dateKey]) =>
					isSameMonthAndYear(dateKey, currentMonthDate, timezone),
				)
				.filter(([_, roomsMap]) => !!roomsMap[selectedRoomId])
				.map(([dateKey, roomsMap]) => {
					const roomInfo = roomsMap[selectedRoomId];
					const { dayNumber } = getDateMetadata(dateKey, timezone);

					return {
						dateKey,
						dayNumber,
						currencySymbol,
						price: roomInfo?.price ?? null,
						priceInPms: roomInfo?.priceInPms ?? null,
						error: !!roomInfo?.error,
						errorReason: roomInfo?.errorReason,
					};
				})
				.sort((a, b) => a.dayNumber - b.dayNumber);
		},
	});
};
