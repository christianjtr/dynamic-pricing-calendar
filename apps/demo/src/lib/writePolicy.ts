/**
 * Fixtures only publish a few canonical PATCH responses; a configured backend
 * owns that decision and must be allowed to accept or reject any day.
 */
export function canWriteDay(
	usingFixtures: boolean,
	hasFixtureUpdate: boolean,
): boolean {
	return !usingFixtures || hasFixtureUpdate;
}
