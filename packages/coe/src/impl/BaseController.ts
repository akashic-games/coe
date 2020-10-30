import { Controller } from "../Controller";
import { Action } from "../parameters";

interface BroadcastDataBuffer<T> {
	data: T;
	priority: number;
}

export class BaseController<Command, ActionData> implements Controller<Command, ActionData> {
	/**
	 * 本 Controller と紐づく Scene のアセット情報。
	 * `this.loaded` の発火以降しか取得できない点に注意。
	 */
	assets: { [assetId: string]: g.Asset } = {};
	/**
	 * 本 controller によるイベントの消化を一時的にロックするかどうか。
	 */
	processingMessageEvent: boolean = false;
	/**
	 * 本 controller によるイベントの消化を一時的にロックするかどうか。
	 */
	loaded: g.Trigger<void> = new g.Trigger();
	update: g.Trigger<void> = new g.Trigger();
	actionReceived: g.Trigger<Action<ActionData>> = new g.Trigger();

	private timerManager: g.TimerManager;
	private broadcastDataBuffer: BroadcastDataBuffer<any>[] = [];

	constructor() {
		this.timerManager = new g.TimerManager(this.update, g.game.fps);
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
		this.update.destroy();
		this.loaded.destroy();
		this.actionReceived.destroy();

		this.assets = null!;
		this.timerManager = null!;
		this.broadcastDataBuffer = null!;
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
