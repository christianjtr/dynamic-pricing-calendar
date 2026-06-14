import { useQuery } from "@tanstack/react-query";
import { getSettings } from "../../services/hotel-api/settings";
import type { HotelSettings } from "../../types/HotelSettings";

export const useHotelSettings = () => {
	return useQuery<HotelSettings | null, Error>({
		queryKey: ["hotel-settings"],
		queryFn: ({ signal }) => getSettings(signal),
		retry: 1,
		refetchOnWindowFocus: false,
	});
};
