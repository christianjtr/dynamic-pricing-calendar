import { createFileRoute } from "@tanstack/react-router";
import { toFixtureResponse } from "../../../../fixtures/response";
import { handleFixtureRequest } from "../../../../fixtures/router";

export const Route = createFileRoute("/api/prices/$roomId/$date")({
	server: {
		handlers: {
			PATCH: async ({ params, request }) => {
				const url = new URL(request.url);
				const body = await request.json().catch(() => undefined);
				return toFixtureResponse(
					handleFixtureRequest({
						body,
						method: "PATCH",
						pathname: `/api/prices/${params.roomId}/${params.date}`,
						searchParams: url.searchParams,
					}),
				);
			},
		},
	},
});
