export interface Selection {
	roomId: string | null;
	date: string | null;
	edit?: boolean;
}

export interface PageLocation {
	pathname: string;
	search: string;
	hash: string;
}

export function readSelection(search: string): Selection {
	const params = new URLSearchParams(search);
	return { roomId: params.get("room"), date: params.get("date") };
}

export function readEdit(search: string): boolean {
	return new URLSearchParams(search).get("edit") === "1";
}

export function selectionHref(
	location: PageLocation,
	{ roomId, date, edit }: Selection,
): string {
	const params = new URLSearchParams(location.search);
	if (roomId) {
		params.set("room", roomId);
	} else {
		params.delete("room");
	}
	if (date) {
		params.set("date", date);
	} else {
		params.delete("date");
	}
	if (edit) {
		params.set("edit", "1");
	} else {
		params.delete("edit");
	}
	const query = params.toString();
	return `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
}
