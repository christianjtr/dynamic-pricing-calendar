import type { FixtureResponse } from "./router";

export function toFixtureResponse({ body, status }: FixtureResponse): Response {
	return Response.json(body, { status });
}
