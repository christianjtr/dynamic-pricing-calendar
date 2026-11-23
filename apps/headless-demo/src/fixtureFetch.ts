import { toFixtureResponse } from "../../playground/src/fixtures/response";
import { handleFixtureRequest } from "../../playground/src/fixtures/router";

export const fixtureFetch: typeof fetch = (input, init) => {
	const url = new URL(
		input instanceof Request ? input.url : String(input),
		window.location.origin,
	);
	const rawBody = init?.body;
	const body =
		typeof rawBody === "string" && rawBody.length > 0
			? JSON.parse(rawBody)
			: undefined;

	return Promise.resolve(
		toFixtureResponse(
			handleFixtureRequest({
				pathname: url.pathname,
				method: init?.method ?? "GET",
				searchParams: url.searchParams,
				body,
			}),
		),
	);
};
