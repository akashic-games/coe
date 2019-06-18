/**
 * g.Scene の切り替えを監視するモジュール。
 */
export abstract class SceneWatcher {
	protected game: g.Game | null = null;

	/**
	 * 本インスタンスを初期化する。
	 *
	 * @param game 属するAkashic EngineのGame
	 */
	initialize(game: g.Game): void {
		this.game = game;
		this.game._sceneChanged.add(this.handleScene, this);
	}

	/**
	 * 本インスタンスを破棄する。
	 */
	destroy(): void {
		this.game!._sceneChanged.remove(this.handleScene, this);
		this.game = null;
	}

	protected abstract handleScene(scene: g.Scene): void;
}
