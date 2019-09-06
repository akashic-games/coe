import { addJoinedPlayer, getPermission, removeJoinedPlayer } from "../global";
import { View } from "../View";
import { BaseController } from "./BaseController";

export interface SceneParameters<Command, ActionData> extends g.SceneParameterObject {
	local?: g.LocalTickMode.InterpolateLocal | g.LocalTickMode.NonLocal;
	controller: BaseController<Command, ActionData>;
}

/**
 * コントローラにより制御される g.Scene 。
 *
 * 本シーンを利用した場合、すべての g.MessageEvent がフレームワーク側で握りつぶされる点に注意。
 * また、以下のパラメータの初期値が g.Scene と異なる点に注意。
 * * local: g.LocalTickMode.InterpolateLocal
 * * tickGenerationMode: g.TickGenerationMode.Manual
 */
export class Scene<Command, ActionData> extends g.Scene implements View<Command, ActionData> {
	commandReceived: g.Trigger<Command> = new g.Trigger();
	private _generateTickManually: boolean = false;
	private _sentInitialEvents: boolean = false;

	/**
	 * 本 Scene に紐づく Controller のインスタンス。
	 *
	 * 通常、ゲーム開発者は本値を参照してはならない。
	 * `this.send()` のみで Controller と通信を行うべきである。
	 */
	protected _controller: BaseController<Command, ActionData>;
	private onEventFiltered_bound: (pevs: any[][]) => any[][];

	constructor(params: SceneParameters<Command, ActionData>) {
		super({
			local: params.local != null ? params.local : g.LocalTickMode.InterpolateLocal,
			tickGenerationMode: params.tickGenerationMode != null ? params.tickGenerationMode : g.TickGenerationMode.Manual,
			...params
		});

		this._generateTickManually = this.tickGenerationMode === g.TickGenerationMode.Manual;
		this._controller = params.controller;
		this.onEventFiltered_bound = this.onEventFiltered.bind(this);
		this.message.add(this.onReceivedMessageEvent, this);
		this.stateChanged.add(this.onStateChanged, this);

		// TODO: 他の判定方法を検討
		if (getPermission().advance) {
			this.update.add(this.fireControllerUpdate, this);
			if (this._generateTickManually) {
				this.update.add(this.raiseTickIfMessageEventExists, this);
			}
			this.loaded.addOnce(() => {
				this._controller.loaded.fire();
			});
		}
	}

	send(data: ActionData, priority?: number): void {
		this.game.raiseEvent(new g.MessageEvent(data, undefined, false, priority));
	}

	// override
	destroy() {
		this.commandReceived.destroy();
		this.game.removeEventFilter(this.onEventFiltered_bound);
		this.message.remove(this.onReceivedMessageEvent, this);

		this.commandReceived = null!;
		this._controller = null!;
		this.onEventFiltered_bound = null!;

		super.destroy();
	}

	private fireControllerUpdate(): void {
		this._controller.update.fire();
	}

	private onEventFiltered(pevs: any[][]): any[][] {
		const filtered: any[][] = [];

		for (let i = 0; i < pevs.length; i++) {
			const pev = pevs[i];

			const type = pev[0];
			const playerId = pev[2];

			if (type === 0x20) {
				// g.MessageEvent
				// 信頼されているメッセージ (playerId === TrustedPlayerId) かどうかは、各アプリケーション実装者が判断する。
				this._controller.actionReceived.fire({
					player: {
						id: playerId
					},
					data: pev[3]
				});
			} else if (type === 0x00) {
				// g.JoinEvent
				if (playerId != null) {
					addJoinedPlayer(playerId);
				}
				filtered.push(pev);
			} else if (type === 0x01) {
				// g.LeaveEvent
				if (playerId != null) {
					removeJoinedPlayer(playerId);
				}
				filtered.push(pev);
			} else {
				filtered.push(pev);
			}
		}

		if (!this._generateTickManually) {
			const messages = this._controller.getBroadcastDataBuffer();
			if (messages) {
				filtered.push(...messages.map(event => [0x20, null, null, event]));
			}
			if (!this._sentInitialEvents) {
				// NOTE: 手動進行->自動進行切替時に自動進行の開始時刻が不明となってしまうため、シーンの切替時に timestamp を挿入する
				filtered.unshift([0x2, null, null, Math.floor(g.game.getCurrentTime())]);
				this._sentInitialEvents = true;
			}
		}

		return filtered;
	}

	private raiseTickIfMessageEventExists(): void {
		const messages = this._controller.getBroadcastDataBuffer();
		if (messages) {
			const events = messages.map(data => new g.MessageEvent(data));
			const timestamp = new g.TimestampEvent(Math.floor(g.game.getCurrentTime()), null as any);
			this.game.raiseTick([timestamp, ...events]);
		}
	}

	private onReceivedMessageEvent(message: g.MessageEvent): void {
		this.commandReceived.fire(message.data);
	}

	private onStateChanged(state: g.SceneState): void {
		if (state === g.SceneState.Deactive || state === g.SceneState.BeforeDestroyed) {
			this.game.removeEventFilter(this.onEventFiltered_bound);
		} else if (state === g.SceneState.Active) {
			this.game.addEventFilter(this.onEventFiltered_bound, true);
			this._sentInitialEvents = false;
		}
	}
}
