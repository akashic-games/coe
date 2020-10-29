import * as pl from "@akashic/playlog";
import { View } from "../View";
import { BaseController } from "./BaseController";

export interface SceneParameters<Command, ActionData> extends g.SceneParameterObject {
	local?: "interpolate-local" | "non-local";
	controller: BaseController<Command, ActionData>;
}

/**
 * コントローラにより制御される g.Scene 。
 *
 * 本シーンを利用した場合、すべての g.MessageEvent がフレームワーク側で握りつぶされる点に注意。
 * また、以下のパラメータの初期値が g.Scene と異なる点に注意。
 * * local: "interpolate-local"
 * * tickGenerationMode: "manual"
 */
export class Scene<Command, ActionData> extends g.Scene implements View<Command, ActionData> {
	commandReceived: g.Trigger<Command> = new g.Trigger();
	private _generatesTickManually: boolean = false;
	private _sentInitialEvents: boolean = false;

	/**
	 * 本 Scene に紐づく Controller のインスタンス。
	 *
	 * 通常、ゲーム開発者は本値を参照してはならない。
	 * `this.send()` のみで Controller と通信を行うべきである。
	 */
	protected _controller: BaseController<Command, ActionData>;
	private onEventFiltered_bound: g.EventFilter;

	constructor(params: SceneParameters<Command, ActionData>) {
		super({
			local: "interpolate-local",
			tickGenerationMode: "manual",
			...params
		});

		this._generatesTickManually = this.tickGenerationMode === "manual";
		this._controller = params.controller;
		this.onEventFiltered_bound = this.onEventFiltered.bind(this);
		this.onMessage.add(this.onReceivedMessageEvent, this);
		this.onStateChange.add(this.onStateChanged, this);

		if (g.game.isActiveInstance()) {
			this.onUpdate.add(this.fireControllerUpdate, this);
			if (this._generatesTickManually) {
				this.onUpdate.add(this.raiseTickIfMessageEventExists, this);
			}
			this.onLoad.addOnce(() => {
				this._controller.assets = this.assets;
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
		this.onMessage.remove(this.onReceivedMessageEvent, this);

		this.commandReceived = null!;
		this._controller = null!;
		this.onEventFiltered_bound = null!;

		super.destroy();
	}

	private fireControllerUpdate(): void {
		this._controller.update.fire();
	}

	private onEventFiltered(pevs: pl.Event[], { processNext }: g.EventFilterController): pl.Event[] {
		const filtered: pl.Event[] = [];

		if (!this._generatesTickManually) {
			if (!this._sentInitialEvents) {
				// NOTE: 手動進行->自動進行切替時に自動進行の開始時刻が不明となってしまうため、シーンの切替時に timestamp を挿入する
				filtered.push([0x2, null!, null, Math.floor(g.game.getCurrentTime())]);
				this._sentInitialEvents = true;
			}
			const buffer = this._controller.getBroadcastDataBuffer();
			if (buffer) {
				filtered.push(
					...buffer.map<pl.Event>(({ data, priority }) => [0x20, priority, null, data])
				);
			}
		}

		for (let i = 0; i < pevs.length; i++) {
			const pev = pevs[i];

			const type = pev[0];
			const playerId = pev[2];

			if (type === 0x20 && playerId != null) {
				// g.MessageEvent
				if (this._controller.lockConsumingMessageEvent) {
					processNext(pev);
					continue;
				}
				// 信頼されているメッセージ (playerId === TrustedPlayerId) かどうかは、各アプリケーション実装者が判断する。
				this._controller.actionReceived.fire({
					player: {
						id: playerId
					},
					data: pev[3]
				});
			} else {
				filtered.push(pev);
			}
		}

		return filtered;
	}

	private raiseTickIfMessageEventExists(): void {
		const buffer = this._controller.getBroadcastDataBuffer();
		if (!buffer) return;
		const events = buffer.map(({ data, priority }) => new g.MessageEvent(data, undefined, undefined, priority));
		const timestamp = new g.TimestampEvent(Math.floor(g.game.getCurrentTime()), null as any);
		this.game.raiseTick([timestamp, ...events]);
	}

	private onReceivedMessageEvent(message?: g.MessageEvent): void {
		if (!message) return;
		this.commandReceived.fire(message.data);
	}

	private onStateChanged(state?: g.SceneStateString): void {
		if (state === "deactive" || state === "before-destroyed") {
			this.game.removeEventFilter(this.onEventFiltered_bound);
		} else if (state === "active") {
			this.game.addEventFilter(this.onEventFiltered_bound, true);
			this._sentInitialEvents = false;
		}
	}
}
