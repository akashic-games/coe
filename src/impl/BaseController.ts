import type { Controller } from "../Controller";
import type { Action } from "../parameters";

interface BroadcastDataBuffer<T> {
	data: T;
	priority: number;
}

export class BaseController<Command, ActionData> implements Controller<Command, ActionData> {
	/**
	 * 本 Controller と紐づく Scene のアセット情報。
	 * `this.onLoad` の発火以降しか取得できない点に注意。
	 */
	assets: { [assetId: string]: g.Asset } = {};
	/**
	 * 本 Controller と紐づく Scene のアセットへのアクセサ。
	 */
	asset: g.AssetAccessor;
	/**
	 * 本 controller による g.MessageEvent の処理を一時的にロックするかどうか。
	 *
	 * 通常、ゲーム開発者は本値を参照・また書き換えてはならない。
	 */
	lockingProcessingMessageEvent: boolean = false;
	/**
	 * 本 controller によるイベントの消化を一時的にロックするかどうか。
	 */
	onLoad: g.Trigger<void> = new g.Trigger();
	onUpdate: g.Trigger<void> = new g.Trigger();
	onActionReceive: g.Trigger<Action<ActionData>> = new g.Trigger();

	/**
	 * @deprecated 非推奨である。将来的に削除される。代わりに `onLoad` を利用すること。
	 */
	loaded: g.Trigger<void> = this.onLoad;
	/**
	 * @deprecated 非推奨である。将来的に削除される。代わりに `onUpdate` を利用すること。
	 */
	update: g.Trigger<void> = this.onUpdate;
	/**
	 * @deprecated 非推奨である。将来的に削除される。代わりに `onActionReceive` を利用すること。
	 */
	actionReceived: g.Trigger<Action<ActionData>> = this.onActionReceive;

	private timerManager: g.TimerManager;
	private broadcastDataBuffer: BroadcastDataBuffer<any>[] = [];

	constructor() {
		this.asset = new g.AssetAccessor(g.game._assetManager);
		this.timerManager = new g.TimerManager(this.onUpdate, g.game.fps);
	}

	/**
	 * View に対してデータをブロードキャストする。
	 * @param data プロードキャストするデータ
	 * @param priority プライオリティ。省略時は 0
	 */
	broadcast(data: Command, priority: number = 0): void {
		this.broadcastDataBuffer.push({ data, priority });
	}

	setTimeout(func: () => void, duration: number, owner?: any): g.TimerIdentifier {
		return this.timerManager.setTimeout(func, duration, owner);
	}

	setInterval(func: () => void, interval: number, owner?: any): g.TimerIdentifier {
		return this.timerManager.setInterval(func, interval, owner);
	}

	clearTimeout(id: g.TimerIdentifier): void {
		this.timerManager.clearTimeout(id);
	}

	clearInterval(id: g.TimerIdentifier): void {
		this.timerManager.clearInterval(id);
	}

	destroy(): void {
		this.onUpdate.destroy();
		this.onLoad.destroy();
		this.onActionReceive.destroy();

		this.assets = null!;
		this.asset = null!;
		this.timerManager = null!;
		this.broadcastDataBuffer = null!;
		this.onUpdate = null!;
		this.onLoad = null!;
		this.onActionReceive = null!;
		this.update = null!;
		this.loaded = null!;
		this.actionReceived = null!;
	}

	getBroadcastDataBuffer(): BroadcastDataBuffer<any>[] | null {
		if (this.broadcastDataBuffer.length) {
			return this.broadcastDataBuffer.splice(0);
		}
		return null;
	}
}
