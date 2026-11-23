import type {
	PricesQuery,
	PricesResponse,
	SettingsResponse,
	UpdatePriceRequest,
	UpdatePriceResponse,
} from "@hpc/contracts";
import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { replaceDay } from "./cache";
import { usePricingClient } from "./provider";
import { pricingKeys } from "./queryKeys";

export type SettingsQueryOptions = Omit<
	UseQueryOptions<SettingsResponse, Error>,
	"queryKey" | "queryFn"
>;

export type PricesQueryOptions = Omit<
	UseQueryOptions<PricesResponse, Error>,
	"queryKey" | "queryFn"
>;

export interface UpdatePriceVariables extends UpdatePriceRequest {
	roomId: string;
	date: string;
}

type UpdatePriceOptions = Omit<
	UseMutationOptions<UpdatePriceResponse, Error, UpdatePriceVariables>,
	"mutationFn" | "onMutate" | "onError" | "onSuccess" | "onSettled"
> & {
	onError?: (error: Error, variables: UpdatePriceVariables) => void;
	onSuccess?: (
		response: UpdatePriceResponse,
		variables: UpdatePriceVariables,
	) => void;
	onSettled?: (
		response: UpdatePriceResponse | undefined,
		error: Error | null,
		variables: UpdatePriceVariables,
	) => void;
};

interface UpdatePriceContext {
	previous: [readonly unknown[], PricesResponse | undefined][];
}

export function useSettings(options?: SettingsQueryOptions) {
	const client = usePricingClient();
	return useQuery({
		queryKey: pricingKeys.settings(client.propertyId),
		queryFn: ({ signal }) => client.getSettings(signal),
		...options,
	});
}

export function usePrices(query: PricesQuery, options?: PricesQueryOptions) {
	const client = usePricingClient();
	return useQuery({
		queryKey: pricingKeys.prices(client.propertyId, query),
		queryFn: ({ signal }) => client.getPrices(query, signal),
		...options,
	});
}

export function useUpdatePrice(options?: UpdatePriceOptions) {
	const client = usePricingClient();
	const queryClient = useQueryClient();
	const { onError, onSuccess, onSettled, ...mutationOptions } = options ?? {};
	const pricesKey = pricingKeys.pricesAll(client.propertyId);

	return useMutation<
		UpdatePriceResponse,
		Error,
		UpdatePriceVariables,
		UpdatePriceContext
	>({
		...mutationOptions,
		mutationFn: ({ roomId, date, price, reason }) =>
			client.updatePrice(roomId, date, { price, reason }),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: pricesKey });
			const previous = queryClient.getQueriesData<PricesResponse>({
				queryKey: pricesKey,
			});
			return { previous };
		},
		onError: (error, variables, context) => {
			for (const [key, data] of context?.previous ?? []) {
				queryClient.setQueryData(key, data);
			}
			onError?.(error, variables);
		},
		onSuccess: (response, variables) => {
			queryClient.setQueriesData<PricesResponse>(
				{ queryKey: pricesKey },
				(old) => (old ? replaceDay(old, response.day) : old),
			);
			onSuccess?.(response, variables);
		},
		onSettled: (response, error, variables) => {
			void queryClient.invalidateQueries({ queryKey: pricesKey });
			onSettled?.(response, error, variables);
		},
	});
}
