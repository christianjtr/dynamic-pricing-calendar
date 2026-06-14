import type { LocalizationSettings } from "./LocalizationSettings";

type BaseRoom = {
	name: string;
};

export type RoomReference = BaseRoom & {
	id: number;
};

export type DerivedRoom = BaseRoom;

export type HotelInventory = {
	derived: Record<string, DerivedRoom>;
	reference: RoomReference;
};

export type HotelSettings = {
	hotel: LocalizationSettings;
	rooms: HotelInventory;
};
