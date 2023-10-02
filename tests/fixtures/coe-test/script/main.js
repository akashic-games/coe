const {
  initialize,
  getPermission,
  isSandbox,
  isJoinedPlayer,
  startSession,
  exitSession,
  startLocalSession,
} = require("@akashic-extension/coe");
const { Scene: COEScene } = require("@akashic-extension/coe");
const { COEController } = require("@akashic-extension/coe");

const game = g.game;

game.vars.snapshots = [];

function stackSnapshot(snapshot) {
  game.vars.snapshots.push(snapshot);
}

class Controller extends COEController {
  constructor() {
    super();
    this.onStartSessionRequest.add(this.handleStartSessionRequest, this);
    this.onActionReceive.add(this.handleActionReceived, this);
  }

  handleStartSessionRequest(session) {
    // console.log("action received", action);
    stackSnapshot({
      name: "start-session",
      parameter: session,
    });
  }

  handleActionReceived(action) {
    // console.log("action received", action);
    stackSnapshot({
      name: "action-received",
      parameter: action,
    });

    if (action.data.name === "broadcast") {
      this.broadcast(action.data.parameter);
    } else if (action.data.name === "broadcast-end") {
      this.broadcastEnd(action.data.parameter);
    }
  }
}

class Scene extends COEScene {
  constructor(...args) {
    super(...args);
    this.next = new g.Trigger();
    this.onCommandReceive.add(this.handleCommandReceived, this);
  }

  handleCommandReceived(command) {
    // console.log("command received", command);
    stackSnapshot({
      name: "command-received",
      sceneName: this.name,
      parameter: command,
    });

    if (command.name === "next-scene") {
      this.next.fire();
    } else if (command.name === "is-joined-player") {
      stackSnapshot({
        name: "joined-players",
        parameter: {
          isJoinedPlayer: isJoinedPlayer(command.playerId),
        },
      });
    } else if (command.name === "start-session") {
      startSession(command.parameter);
    } else if (command.name === "start-local-session") {
      startLocalSession(command.parameter);
    } else if (command.name === "exit-session") {
      exitSession(command.parameter.sessionId, command.parameter.parameter);
    }
  }
}

let sceneCreatedCount = 0;

function createScene(parameter) {
  const scene = new Scene({
    ...parameter,
    name: `test-scene-${sceneCreatedCount++}`,
  });
  scene.next.add(() => {
    game.pushScene(createScene(parameter));
  });
  return scene;
}

module.exports = (args) => {
  initialize({
    args,
    game,
  });

  stackSnapshot({
    name: "initialize",
    parameter: {
      permission: getPermission(),
      isSandbox: isSandbox(),
    },
  });

  const controller = new Controller();
  const scene = createScene({
    game,
    controller,
  });

  game.pushScene(scene);
};
