import { createFileRoute } from "@tanstack/react-router";
import openApiDocument from "../../../../packages/contracts/openapi.yaml?raw";

export const Route = createFileRoute("/openapi.yaml")({
	server: {
		handlers: {
			GET: () =>
				new Response(openApiDocument, {
					headers: {
						"Content-Disposition":
							'attachment; filename="pricing-calendar-openapi.yaml"',
						"Content-Type": "application/yaml; charset=utf-8",
					},
				}),
		},
	},
});
