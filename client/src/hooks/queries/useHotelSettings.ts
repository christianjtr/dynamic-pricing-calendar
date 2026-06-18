import { getSettings } from "@/services/hotel-api/settings";
import type { HotelSettings } from "@/types/HotelSettings";
import { useQuery } from "@tanstack/react-query";

export const useHotelSettings = () => {
	return useQuery<HotelSettings, Error>({
		queryKey: ["hotel-settings"],
		queryFn: ({ signal }) => getSettings(signal),
		retry: 2,
		refetchOnWindowFocus: false,
	});
};
