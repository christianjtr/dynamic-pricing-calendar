import type { HotelSettings } from "../types/HotelSettings";

export function getRoomSelectOptions(settings: HotelSettings) {
	const referenceId = String(settings.rooms.reference.id);
	const roomNamesMap: Record<string, string> = {
		[referenceId]: settings.rooms.reference.name,
	};

	for (const [id, roomInfo] of Object.entries(settings.rooms.derived)) {
		roomNamesMap[id] = roomInfo.name;
	}

	return Object.entries(roomNamesMap).map(([id, name]) => ({
		value: id,
		label: id === referenceId ? `${name} (Reference)` : name,
	}));
}
