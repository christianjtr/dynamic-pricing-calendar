import type { HotelSettings } from "@/types/HotelSettings";
import { getBrowserTimezone, getCurrencyFromLocale } from "@/utils/browserAPI";
import { getRoomSelectOptions } from "@/utils/rooms";
import { createContext, useContext, useMemo, useState } from "react";

interface HotelSettingsContextType {
	locale: string;
	handleLocaleChange: (newLocale: string) => void;
	timezone: string;
	setTimezone: React.Dispatch<React.SetStateAction<string>>;
	selectedRoomId: string | null;
	setSelectedRoomId: React.Dispatch<React.SetStateAction<string | null>>;
	roomSelectOptions: { value: string; label: string }[];
	activeRoomName: string;
	currencySymbol: string;
	currencyCode: string;
}

interface HotelSettingsProviderProps {
	initialSettings: HotelSettings;
	children: React.ReactNode;
}

const HotelSettingsContext = createContext<
	HotelSettingsContextType | undefined
>(undefined);

export const HotelSettingsProvider: React.FC<HotelSettingsProviderProps> = ({
	initialSettings,
	children,
}) => {
	const [locale, setLocale] = useState<string>(
		initialSettings.hotel.locale || "en-US",
	);
	const [timezone, setTimezone] = useState<string>(
		initialSettings.hotel.timezone || getBrowserTimezone(),
	);
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
		String(initialSettings.rooms.reference.id),
	);

	const [{ code: currencyCode, symbol: currencySymbol }, setCurrency] =
		useState(() => getCurrencyFromLocale(locale));

	const handleLocaleChange = (newLocale: string) => {
		setLocale(newLocale);
		setCurrency(getCurrencyFromLocale(newLocale));
		// Reset timezone when locale changes (user can reselect)
		setTimezone(initialSettings.hotel.timezone || getBrowserTimezone());
	};

	const roomSelectOptions = useMemo(
		() => getRoomSelectOptions(initialSettings),
		[initialSettings],
	);

	const activeRoomName = useMemo(() => {
		const matchedOption = roomSelectOptions.find(
			(option) => option.value === selectedRoomId,
		);
		return matchedOption?.label || `Room #${selectedRoomId}`;
	}, [roomSelectOptions, selectedRoomId]);

	return (
		<HotelSettingsContext.Provider
			value={{
				locale,
				handleLocaleChange,
				timezone,
				setTimezone,
				selectedRoomId,
				setSelectedRoomId,
				roomSelectOptions,
				activeRoomName,
				currencySymbol,
				currencyCode,
			}}
		>
			{children}
		</HotelSettingsContext.Provider>
	);
};

export const useHotelSettingsContext = () => {
	const context = useContext(HotelSettingsContext);
	if (!context)
		throw new Error(
			"❌ useHotelSettingsContext must be used within a HotelSettingsProvider",
		);
	return context;
};
