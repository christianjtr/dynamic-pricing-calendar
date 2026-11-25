import { createServer } from "node:http";

// Dev-only test double: static contract-shaped responses, no pricing engine.
const PORT = 3002;
const ALLOWED_ORIGINS = new Set([
	"http://127.0.0.1:3001",
	"http://localhost:3001",
]);
const PROPERTY_ID = "test-property";
const ROOM_ID = "9001";
const DATE_RANGE = { from: "2026-12-01", to: "2026-12-07" };
const GENERATED_AT = "2026-11-25T22:30:00.000Z";
const REJECTED_DATES = new Set(["2026-12-02"]);

const baseDays = [
	{
		roomId: ROOM_ID,
		date: "2026-12-01",
		status: "auto",
		currency: "USD",
		price: 250,
		priceInPms: 240,
		recommendedPrice: 245,
		variance: { value: 2.1, direction: "up", severity: "low", label: "+2.1%" },
		availability: "available",
		occupancy: 0.5,
		restrictions: [],
		isClosed: false,
		error: null,
	},
	{
		roomId: ROOM_ID,
		date: "2026-12-02",
		status: "auto",
		currency: "USD",
		price: 260,
		priceInPms: 240,
		recommendedPrice: 255,
		variance: { value: 2, direction: "up", severity: "low", label: "+2%" },
		availability: "restricted",
		occupancy: 0.61,
		restrictions: ["min-stay:2"],
		isClosed: false,
		error: null,
	},
	{
		roomId: ROOM_ID,
		date: "2026-12-03",
		status: "manual",
		currency: "USD",
		price: 275,
		priceInPms: 240,
		recommendedPrice: 280,
		variance: {
			value: -1.8,
			direction: "down",
			severity: "low",
			label: "-1.8%",
		},
		availability: "available",
		occupancy: 0.7,
		restrictions: [],
		isClosed: false,
		error: null,
	},
];

const currentDays = structuredClone(baseDays);
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function headersFor(request) {
	const origin = request.headers.origin;
	const headers = { "content-type": "application/json", vary: "Origin" };
	if (origin && ALLOWED_ORIGINS.has(origin)) {
		headers["access-control-allow-origin"] = origin;
		headers["access-control-allow-methods"] = "GET, PATCH, OPTIONS";
		headers["access-control-allow-headers"] = "content-type, x-property-id";
	}
	return headers;
}

function error(status, code, message) {
	return { status, body: { error: { code, message } } };
}

function isIsoDate(value) {
	if (typeof value !== "string" || !isoDate.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00Z`);
	return (
		!Number.isNaN(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value
	);
}

function settings() {
	return {
		status: 200,
		body: {
			hotel: { timezone: "UTC", locale: "en-US", currency: "USD" },
			rooms: [
				{
					id: ROOM_ID,
					name: "Test Backend Room",
					description: "Served by the dev-only test backend.",
					isReference: true,
				},
			],
			dateRange: { ...DATE_RANGE },
		},
	};
}

function prices(url) {
	const from = url.searchParams.get("from");
	const to = url.searchParams.get("to");
	if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
		return error(400, "INVALID_QUERY", "from and to must be valid ISO dates");
	}

	const rooms = url.searchParams.getAll("room");
	if (rooms.length > 0 && !rooms.includes(ROOM_ID)) {
		return {
			status: 200,
			body: {
				timezone: "UTC",
				currency: "USD",
				generatedAt: GENERATED_AT,
				rooms: [],
			},
		};
	}

	return {
		status: 200,
		body: {
			timezone: "UTC",
			currency: "USD",
			generatedAt: GENERATED_AT,
			rooms: [
				{
					roomId: ROOM_ID,
					name: "Test Backend Room",
					days: structuredClone(
						currentDays.filter((day) => day.date >= from && day.date <= to),
					),
				},
			],
		},
	};
}

function updatePrice(roomId, date, body) {
	if (roomId !== ROOM_ID || !isIsoDate(date)) {
		return error(404, "UNKNOWN_DAY", "No such room or day");
	}
	if (
		!body ||
		typeof body !== "object" ||
		typeof body.price !== "number" ||
		!Number.isFinite(body.price) ||
		body.price < 0
	) {
		return error(
			400,
			"INVALID_UPDATE_REQUEST",
			"price must be a non-negative number",
		);
	}

	if (REJECTED_DATES.has(date)) {
		return error(
			422,
			"BACKEND_REJECTED",
			`The test backend rejects manual overrides on ${date}.`,
		);
	}

	const index = currentDays.findIndex((day) => day.date === date);
	if (index < 0) {
		return error(404, "UNKNOWN_DAY", "No fixture day for this date");
	}

	const accepted = {
		...structuredClone(currentDays[index]),
		status: "manual",
		price: body.price,
		recommendedPrice: 245,
		variance: null,
	};
	currentDays[index] = accepted;

	return {
		status: 200,
		body: { day: structuredClone(accepted), acceptedAt: GENERATED_AT },
	};
}

async function readBody(request) {
	const chunks = [];
	for await (const chunk of request) chunks.push(chunk);
	const raw = Buffer.concat(chunks).toString("utf8");
	if (!raw) return undefined;
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
	const method = request.method ?? "GET";
	let result;

	if (method === "OPTIONS") {
		response.writeHead(204, headersFor(request));
		response.end();
		return;
	}

	if (request.headers["x-property-id"] !== PROPERTY_ID) {
		result = error(
			400,
			"MISSING_PROPERTY",
			"x-property-id must be test-property",
		);
	} else if (url.pathname === "/api/settings" && method === "GET") {
		result = settings();
	} else if (url.pathname === "/api/prices" && method === "GET") {
		result = prices(url);
	} else {
		const match = url.pathname.match(
			/^\/api\/prices\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/,
		);
		if (match && method === "PATCH") {
			result = updatePrice(
				decodeURIComponent(match[1] ?? ""),
				match[2] ?? "",
				await readBody(request),
			);
		} else {
			result = error(404, "NOT_FOUND", "Unknown test backend operation");
		}
	}

	console.log(`${method} ${url.pathname} → ${result.status}`);
	response.writeHead(result.status, headersFor(request));
	response.end(result.body ? JSON.stringify(result.body) : undefined);
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`Test backend listening on http://127.0.0.1:${PORT}/api`);
});
