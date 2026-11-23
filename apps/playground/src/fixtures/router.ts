import {
	type ApiError,
	PricesQuerySchema,
	type PricesResponse,
	type SettingsResponse,
	UpdatePriceRequestSchema,
	type UpdatePriceResponse,
} from "@hpc/contracts";
import {
	apiError,
	fixtureDateRange,
	pricesFixture,
	settingsFixture,
	updateFixtures,
} from "./fixtures";

export interface FixtureRequest {
	pathname: string;
	method: string;
	searchParams: URLSearchParams;
	body?: unknown;
}

export type FixtureResponseBody =
	| SettingsResponse
	| PricesResponse
	| UpdatePriceResponse
	| ApiError;

export interface FixtureResponse {
	status: number;
	body: FixtureResponseBody;
}

const currentPrices: PricesResponse = structuredClone(pricesFixture);

const stripApiPrefix = (pathname: string) =>
	pathname.replace(/^\/api(?=\/|$)/, "") || "/";

export function handleFixtureRequest(request: FixtureRequest): FixtureResponse {
	const path = stripApiPrefix(request.pathname);
	const method = request.method.toUpperCase();

	if (path === "/settings" && method === "GET") {
		return { status: 200, body: settingsFixture };
	}

	if (path === "/prices" && method === "GET") {
		const rooms = request.searchParams.getAll("room");
		const parsed = PricesQuerySchema.safeParse({
			from: request.searchParams.get("from") ?? fixtureDateRange.from,
			to: request.searchParams.get("to") ?? fixtureDateRange.to,
			rooms: rooms.length > 0 ? rooms : undefined,
		});

		if (!parsed.success) {
			return {
				status: 400,
				body: apiError("INVALID_QUERY", "Invalid prices query"),
			};
		}

		const { from, to, rooms: selectedRooms } = parsed.data;
		const roomIds = new Set(
			selectedRooms ?? currentPrices.rooms.map((room) => room.roomId),
		);

		return {
			status: 200,
			body: {
				...currentPrices,
				rooms: currentPrices.rooms
					.filter((room) => roomIds.has(room.roomId))
					.map((room) => ({
						...room,
						days: room.days.filter((day) => day.date >= from && day.date <= to),
					})),
			},
		};
	}

	const updateMatch = path.match(/^\/prices\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/);
	if (updateMatch && method === "PATCH") {
		const roomId = decodeURIComponent(updateMatch[1] ?? "");
		const date = updateMatch[2] ?? "";
		const parsedBody = UpdatePriceRequestSchema.safeParse(request.body);

		if (!parsedBody.success) {
			return {
				status: 400,
				body: apiError("INVALID_UPDATE_REQUEST", "Invalid price update"),
			};
		}

		const canonical = updateFixtures[`${roomId}:${date}`];
		const room = currentPrices.rooms.find((item) => item.roomId === roomId);
		if (!canonical || !room?.days.some((day) => day.date === date)) {
			return {
				status: 404,
				body: apiError("UNKNOWN_DAY", "No canonical fixture for this day"),
			};
		}

		room.days = room.days.map((day) =>
			day.date === date ? canonical.day : day,
		);

		return { status: 200, body: canonical };
	}

	return {
		status: 404,
		body: apiError("NOT_FOUND", "Unknown fixture endpoint"),
	};
}
