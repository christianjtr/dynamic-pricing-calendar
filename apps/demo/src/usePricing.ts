import type { DayPrice, PricesQuery, PricesResponse } from "@hpc/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingClient } from "./api";

export interface UpdatePriceVariables {
	roomId: string;
	date: string;
	price: number;
	reason: string;
}

const settingsKey = ["settings"] as const;
const pricesKey = ["prices"] as const;

function replaceDay(prices: PricesResponse, day: DayPrice): PricesResponse {
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

export function usePricing(query: PricesQuery | null, roomId: string | null) {
	const queryClient = useQueryClient();
	const settings = useQuery({
		queryKey: settingsKey,
		queryFn: ({ signal }) => pricingClient.getSettings(signal),
	});
	const prices = useQuery({
		queryKey: [
			...pricesKey,
			query?.from ?? null,
			query?.to ?? null,
			query?.rooms ?? [],
		],
		enabled: query !== null,
		queryFn: ({ signal }) => {
			if (!query) {
				throw new Error("Missing price range");
			}
			return pricingClient.getPrices(query, signal);
		},
	});
	const activeRoomId =
		roomId ??
		settings.data?.rooms.find((item) => item.isReference)?.id ??
		settings.data?.rooms[0]?.id ??
		null;
	const updatePrice = useMutation({
		mutationFn: ({ roomId, date, price, reason }: UpdatePriceVariables) =>
			pricingClient.updatePrice(roomId, date, { price, reason }),
		onSuccess: (response) => {
			queryClient.setQueriesData<PricesResponse>(
				{ queryKey: pricesKey },
				(current) => (current ? replaceDay(current, response.day) : current),
			);
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: pricesKey });
		},
	});

	return {
		settings,
		prices,
		rooms: settings.data?.rooms ?? [],
		activeRoomId,
		days:
			prices.data?.rooms.find((room) => room.roomId === activeRoomId)?.days ??
			[],
		updatePrice,
	};
}
