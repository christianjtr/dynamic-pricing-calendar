import { createFileRoute } from "@tanstack/react-router";
import { toFixtureResponse } from "../../../fixtures/response";
import { handleFixtureRequest } from "../../../fixtures/router";

export const Route = createFileRoute("/api/prices/")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const url = new URL(request.url);
				return toFixtureResponse(
					handleFixtureRequest({
						method: "GET",
						pathname: url.pathname,
						searchParams: url.searchParams,
					}),
				);
			},
		},
	},
});
