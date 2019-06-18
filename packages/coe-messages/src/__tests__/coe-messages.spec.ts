/**
 * ビルドテスト
 */
import * as messages from "..";

describe("build test", () => {
	it("SessionStartMessage", () => {
		const sessionStartMessage: messages.COESessionStartMessage<any> = {
			type: "start",
			parameters: {
				dummySessionId: "dummy"
			}
		};
		expect(sessionStartMessage.type).toBe("start");
		expect(sessionStartMessage.parameters).toEqual({
			dummySessionId: "dummy"
		});
	});

	it("SessionCloseMessage", () => {
		const sessionCloseMessage: messages.COESessionCloseMessage = {
			type: "end"
		};
		expect(sessionCloseMessage.type).toBe("end");
	});

	it("ChildSessionStartMessage", () => {
		const childSessionStartMessage: messages.COEChildSessionStartMessage = {
			type: "child_start",
			sessionId: "session-id"
		};
		expect(childSessionStartMessage.type).toBe("child_start");
		expect(childSessionStartMessage.sessionId).toBe("session-id");
	});

	it("ChildSessionEndMessage", () => {
		const childSessionEndMessage: messages.COEChildSessionEndMessage = {
			type: "child_end",
			sessionId: "session-id",
			result: {
				data: "hoge"
			},
			error: null
		};
		expect(childSessionEndMessage.type).toBe("child_end");
		expect(childSessionEndMessage.sessionId).toBe("session-id");
		expect(childSessionEndMessage.result).toEqual({
			data: "hoge"
		});
	});

	it("ExternalMessage", () => {
		const externalMessage: messages.COEExternalMessage = {
			type: "hoge_message",
			sessionId: "session-id",
			data: {
				data: "hoge"
			}
		};
		expect(externalMessage.type).toBe("hoge_message");
		expect(externalMessage.sessionId).toBe("session-id");
		expect(externalMessage.data).toEqual({
			data: "hoge"
		});
	});
});
