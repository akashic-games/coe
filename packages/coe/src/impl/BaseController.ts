import { Controller } from "../Controller";
import { Action } from "../parameters";

export class BaseController<Command, ActionData> implements Controller<Command, ActionData> {
	loaded: g.Trigger<void> = new g.Trigger();
	update: g.Trigger<void> = new g.Trigger();
	actionReceived: g.Trigger<Action<ActionData>> = new g.Trigger();

	private timerManager: g.TimerManager;
	private broadcastDataBuffer: any[] = [];

	constructor() {
		this.timerManager = new g.TimerManager(this.update, g.game.fps);
	}

	broadcast(data: Command): void {
		this.broadcastDataBuffer.push(data);
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
		this.broadcastDataBuffer = null!;
		this.update = null!;
		this.loaded = null!;
		this.actionReceived = null!;
	}

	getBroadcastDataBuffer(): any[] | null {
		if (this.broadcastDataBuffer.length) {
			return this.broadcastDataBuffer.splice(0);
		}
		return null;
	}
}
