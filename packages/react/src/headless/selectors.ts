import type {
	DayPrice,
	PricesResponse,
	SettingsResponse,
} from "@hpc/contracts";

export function getDefaultRoomId(
	settings: SettingsResponse | undefined,
): string | null {
	const rooms = settings?.rooms ?? [];
	return rooms.find((room) => room.isReference)?.id ?? rooms[0]?.id ?? null;
}

export function getRoomDays(
	prices: PricesResponse | undefined,
	roomId: string | null,
): DayPrice[] {
	if (!prices || !roomId) {
		return [];
	}
	return prices.rooms.find((room) => room.roomId === roomId)?.days ?? [];
}

export function getDayByDate(
	days: DayPrice[],
	date: string,
): DayPrice | undefined {
	return days.find((day) => day.date === date);
}
