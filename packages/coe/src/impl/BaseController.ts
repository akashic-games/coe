import { Controller } from "../Controller";
import { Action } from "../parameters";

export class BaseController<Command, ActionData> implements Controller<Command, ActionData> {
	loaded: g.Trigger<void> = new g.Trigger();
	update: g.Trigger<void> = new g.Trigger();
	actionReceived: g.Trigger<Action<ActionData>> = new g.Trigger();

	private timerManager: g.TimerManager;
	private tickBuffer: any[][] = [];

	constructor() {
		this.timerManager = new g.TimerManager(this.update, g.game.fps);
		this.update.add(this.onUpdate, this);
	}

	broadcast(data: Command): void {
		// NOTE: g.game.getCurrentTime() は小数点以下を含むので整数値化する。
		const timestamp = new g.TimestampEvent(Math.floor(g.game.getCurrentTime()), null as any);
		const event = new g.MessageEvent(data);
		this.tickBuffer.push([timestamp, event]);
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

		this.timerManager = null!;
		this.tickBuffer = null!;
		this.update = null!;
		this.loaded = null!;
		this.actionReceived = null!;
	}

	private onUpdate(): void {
		if (this.tickBuffer.length) {
			g.game.raiseTick(this.tickBuffer.shift());
		}
	}
}
