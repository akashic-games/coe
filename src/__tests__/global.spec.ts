import { addJoinedPlayer, isJoinedPlayer, removeJoinedPlayer } from "../global";

describe("global", () => {
	it("addJoinedPlayer() / removeJoinedPlayer()", () => {
		expect(isJoinedPlayer("player1")).toBe(false);

		addJoinedPlayer("player1");
		expect(isJoinedPlayer("player1")).toBe(true);

		addJoinedPlayer("player2");
		expect(isJoinedPlayer("player2")).toBe(true);

		removeJoinedPlayer("player1");
		expect(isJoinedPlayer("player1")).toBe(false);
		expect(isJoinedPlayer("player2")).toBe(true);

		removeJoinedPlayer("player2");
		expect(isJoinedPlayer("player1")).toBe(false);
		expect(isJoinedPlayer("player2")).toBe(false);
	});
});
