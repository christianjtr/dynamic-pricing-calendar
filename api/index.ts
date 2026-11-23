import {
	eventHandler,
	getRequestURL,
	readBody,
	setResponseStatus,
} from "vinxi/http";
import { handleFixtureRequest } from "./router";

export default eventHandler(async (event) => {
	const url = getRequestURL(event);
	const method = event.node.req.method ?? "GET";
	const body =
		method.toUpperCase() === "PATCH" ? await readBody(event) : undefined;
	const result = handleFixtureRequest({
		pathname: url.pathname,
		method,
		searchParams: url.searchParams,
		body,
	});

	setResponseStatus(event, result.status);
	return result.body;
});
