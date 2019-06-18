import { addJoinedPlayer, getPermission, removeJoinedPlayer } from "../global";
import { View } from "../View";
import { BaseController } from "./BaseController";

export interface SceneParameters<Command, ActionData> extends g.SceneParameterObject {
	local?: g.LocalTickMode.InterpolateLocal;
	tickGenerationMode?: g.TickGenerationMode.Manual;
	controller: BaseController<Command, ActionData>;
}

/**
 * コントローラにより制御される g.Scene 。
 *
 * 本シーンはローカルティック補間モードかつ手動進行として初期化され、
 * すべての g.MessageEvent がフレームワーク側で握りつぶされる点に注意。
 *
 * 本クラスのインスタンス生成時に渡されるパラメータは以下のように破壊的に変更される点に注意。
 * * local: g.LocalTickMode.InterpolateLocal
 * * tickGenerationMode: g.TickGenerationMode.Manual
 */
export class Scene<Command, ActionData> extends g.Scene implements View<Command, ActionData> {
	commandReceived: g.Trigger<Command>;

	/**
	 * 本 Scene に紐づく Controller のインスタンス。
	 *
	 * 通常、ゲーム開発者は本値を参照してはならない。
	 * `this.send()` のみで Controller と通信を行うべきである。
	 */
	protected _controller: BaseController<Command, ActionData>;
	private onEventFiltered_bound: (pevs: any[][]) => any[][];

	constructor(params: SceneParameters<Command, ActionData>) {
		params.local = g.LocalTickMode.InterpolateLocal;
		params.tickGenerationMode = g.TickGenerationMode.Manual;
		super(params);

		this._controller = params.controller;
		this.commandReceived = new g.Trigger();
		this.onEventFiltered_bound = this.onEventFiltered.bind(this);
		this.message.add(this.onReceivedMessageEvent, this);
		this.stateChanged.add(this.onStateChanged, this);

		// TODO: 他の判定方法を検討
		if (getPermission().advance) {
			this.update.add(this.fireControllerUpdate, this);
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
		if (!pevs.length) return pevs;

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

		return filtered;
	}

	private onReceivedMessageEvent(message: g.MessageEvent): void {
		this.commandReceived.fire(message.data);
	}

	private onStateChanged(state: g.SceneState): void {
		if (state === g.SceneState.Deactive || state === g.SceneState.BeforeDestroyed) {
			this.game.removeEventFilter(this.onEventFiltered_bound);
		} else if (state === g.SceneState.Active) {
			this.game.addEventFilter(this.onEventFiltered_bound, true);
		}
	}
}
