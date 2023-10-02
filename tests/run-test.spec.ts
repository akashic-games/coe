import { join } from "path";
import * as childProcess from "child_process";
import { existsSync } from "fs";
import { promisify } from "util";
import { GameContext } from "@akashic/headless-akashic";
const exec = promisify(childProcess.exec);

async function prepare() {
	const context = new GameContext({
		gameJsonPath: join(__dirname, "fixtures", "coe-test", "game.json"),
		verbose: false
	});

	const mockActiveSend = jest.fn();
	const mockActiveCOEStart = jest.fn();
	const mockActiveCOEExit = jest.fn();

	const mockPassiveSend = jest.fn();
	const mockPassiveCOEStart = jest.fn();
	const mockPassiveCOEExit = jest.fn();

	const activeClient = await context.getGameClient({
		externalValue: {
			send: mockActiveSend,
			coe: {
				startSession: mockActiveCOEStart,
				exitSession: mockActiveCOEExit
			}
		}
	});
	const passiveClient = await context.createPassiveGameClient({
		player: { id: "passive-0", name: "passive-0" },
		externalValue: {
			send: mockPassiveSend,
			coe: {
				startSession: mockPassiveCOEStart,
				exitSession: mockPassiveCOEExit
			}
		}
	});

	return {
		context,
		activeClient,
		passiveClient,
		mockActiveSend,
		mockActiveCOEStart,
		mockActiveCOEExit,
		mockPassiveSend,
		mockPassiveCOEStart,
		mockPassiveCOEExit
	};
}

describe("run-test", () => {
	beforeAll(async () => {
		if (process.env.SKIP_INSTALL != null) {
			const { stdout } = await exec("npm pack --dry-run", { cwd: join(__dirname, "..") });
			const tarName = stdout.trim();
			if (existsSync(join(__dirname, "fixtures", "coe-test", tarName))) {
				console.log(`skipping pack generation as ${tarName} already exists.`);
				return;
			}
		}
		const { stdout } = await exec("npm pack --pack-destination ./tests/fixtures/coe-test", { cwd: join(__dirname, "..") });
		const tarName = stdout.trim();
		await exec(`akashic-cli-install ${tarName}`, { cwd: join(__dirname, "fixtures", "coe-test") });
	}, 50 * 1000);

	test("run", async () => {
		const { context, activeClient, passiveClient } = await prepare();

		// send join event
		activeClient.sendJoinEvent("joined-user", "joined-user");

		// send start session parameter
		activeClient.sendMessage(
			{
				type: "start",
				parameters: {
					name: "session-parameter"
				}
			},
			":akashic"
		);

		// check joined player
		activeClient.sendMessage({
			name: "broadcast",
			parameter: { name: "is-joined-player", playerId: "joined-user" }
		});

		// check the message event
		activeClient.sendMessage({ name: "broadcast", parameter: { data: "foo" } });

		// change current scene
		activeClient.sendMessage({
			name: "broadcast",
			parameter: { name: "next-scene" }
		});

		await activeClient.advanceUntil(() => activeClient.game.scene()!.name === "test-scene-1");

		// check the message event
		activeClient.sendMessage({ name: "broadcast", parameter: { data: "bar" } });
		await context.advance(100);

		expect(activeClient.game.vars.snapshots).toEqual([
			{
				name: "initialize",
				parameter: {
					permission: {
						advance: true,
						aggregation: true,
						advanceRequest: true
					},
					isSandbox: false
				}
			},
			{
				name: "start-session",
				parameter: {
					type: "start",
					parameters: {
						name: "session-parameter"
					}
				}
			},
			{
				name: "action-received",
				parameter: {
					player: {
						id: ":akashic"
					},
					data: {
						type: "start",
						parameters: {
							name: "session-parameter"
						}
					}
				}
			},
			{
				name: "action-received",
				parameter: {
					player: {},
					data: {
						name: "broadcast",
						parameter: {
							name: "is-joined-player",
							playerId: "joined-user"
						}
					}
				}
			},
			{
				name: "action-received",
				parameter: {
					player: {},
					data: {
						name: "broadcast",
						parameter: {
							data: "foo"
						}
					}
				}
			},
			{
				name: "action-received",
				parameter: {
					player: {},
					data: {
						name: "broadcast",
						parameter: {
							name: "next-scene"
						}
					}
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-0",
				parameter: {
					name: "is-joined-player",
					playerId: "joined-user"
				}
			},
			{
				name: "joined-players",
				parameter: {
					isJoinedPlayer: true
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-0",
				parameter: {
					data: "foo"
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-0",
				parameter: {
					name: "next-scene"
				}
			},
			{
				name: "action-received",
				parameter: {
					player: {},
					data: {
						name: "broadcast",
						parameter: {
							data: "bar"
						}
					}
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-1",
				parameter: {
					data: "bar"
				}
			}
		]);

		expect(passiveClient.game.vars.snapshots).toEqual([
			{
				name: "initialize",
				parameter: {
					permission: {
						advance: false,
						aggregation: false,
						advanceRequest: false
					},
					isSandbox: false
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-0",
				parameter: {
					name: "is-joined-player",
					playerId: "joined-user"
				}
			},
			{
				name: "joined-players",
				parameter: {
					isJoinedPlayer: true
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-0",
				parameter: {
					data: "foo"
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-0",
				parameter: {
					name: "next-scene"
				}
			},
			{
				name: "command-received",
				sceneName: "test-scene-1",
				parameter: {
					data: "bar"
				}
			}
		]);
	});

	describe("coe-plugin", () => {
		it("startSession", async () => {
			const { context, activeClient, mockActiveCOEStart, mockPassiveCOEStart } = await prepare();

			activeClient.sendMessage({ name: "broadcast", parameter: { name: "start-session", parameter: { sessionId: "session-id" } } });
			await context.advance(100);

			expect(mockActiveCOEStart.mock.calls).toHaveLength(1);
			expect(mockActiveCOEStart.mock.calls[0][0]).toEqual({ sessionId: "session-id" });

			expect(mockPassiveCOEStart.mock.calls).toHaveLength(1);
			expect(mockPassiveCOEStart.mock.calls[0][0]).toEqual({ sessionId: "session-id" });
		});

		it("exitSession", async () => {
			const { context, activeClient, mockActiveCOEExit, mockPassiveCOEExit } = await prepare();

			activeClient.sendMessage({
				name: "broadcast",
				parameter: { name: "exit-session", parameter: { sessionId: "session-id", parameter: { score: 10 } } }
			});
			await context.advance(100);

			expect(mockActiveCOEExit.mock.calls).toHaveLength(1);
			expect(mockActiveCOEExit.mock.calls[0][0]).toBe("session-id");
			expect(mockActiveCOEExit.mock.calls[0][1]).toEqual({ score: 10 });

			expect(mockPassiveCOEExit.mock.calls).toHaveLength(1);
			expect(mockPassiveCOEExit.mock.calls[0][0]).toBe("session-id");
			expect(mockPassiveCOEExit.mock.calls[0][1]).toEqual({ score: 10 });
		});

		it("startLocalSession", async () => {
			const { context, activeClient, mockActiveCOEStart, mockPassiveCOEStart } = await prepare();

			activeClient.sendMessage({
				name: "broadcast",
				parameter: {
					name: "start-local-session",
					parameter: {
						sessionId: "session-id",
						additionalData: { foo: "bar" },
						application: {
							type: "app-type",
							version: "app-version",
							url: "https://example.com/app-url"
						},
						delayRange: 100
					}
				}
			});
			await context.advance(100);

			expect(mockActiveCOEStart.mock.calls).toHaveLength(1);
			expect(mockActiveCOEStart.mock.calls[0][0].additionalData).toEqual({ foo: "bar" });
			expect(mockActiveCOEStart.mock.calls[0][0].application).toEqual({
				type: "app-type",
				version: "app-version",
				url: "https://example.com/app-url"
			});
			expect(mockActiveCOEStart.mock.calls[0][0].delayRange).toBe(100);
			expect(mockActiveCOEStart.mock.calls[0][0].sessionId).toBeDefined(); // 内容には関知しない

			expect(mockPassiveCOEStart.mock.calls).toHaveLength(1);
			expect(mockPassiveCOEStart.mock.calls[0][0].additionalData).toEqual({ foo: "bar" });
			expect(mockPassiveCOEStart.mock.calls[0][0].application).toEqual({
				type: "app-type",
				version: "app-version",
				url: "https://example.com/app-url"
			});
			expect(mockPassiveCOEStart.mock.calls[0][0].delayRange).toBe(100);
			expect(mockPassiveCOEStart.mock.calls[0][0].sessionId).toBeDefined(); // 内容には関知しない
		});

		it("broadcastEnd", async () => {
			const { context, activeClient, mockActiveSend, mockPassiveSend } = await prepare();

			activeClient.sendMessage({ name: "broadcast-end", parameter: { score: 200 } }, ":akashic");
			await context.advance(100);

			expect(mockActiveSend.mock.calls).toHaveLength(1);
			expect(mockActiveSend.mock.calls[0][0]).toEqual({
				type: "end",
				sessionId: "0",
				data: { result: { score: 200 } }
			});

			expect(mockPassiveSend.mock.calls).toHaveLength(1);
			expect(mockPassiveSend.mock.calls[0][0]).toEqual({
				type: "end",
				sessionId: "0",
				data: { result: { score: 200 } }
			});
		});
	});
});
