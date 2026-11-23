import type { DayPrice, PricesResponse } from "@hpc/contracts";

export function replaceDay(
	prices: PricesResponse,
	day: DayPrice,
): PricesResponse {
	return {
		...prices,
		rooms: prices.rooms.map((room) =>
			room.roomId === day.roomId
				? {
						...room,
						days: room.days.map((current) =>
							current.date === day.date ? day : current,
						),
					}
				: room,
		),
	};
}
