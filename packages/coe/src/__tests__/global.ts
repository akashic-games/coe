import * as g from "@akashic/akashic-engine";

declare global {
	namespace NodeJS {
		interface Global {
			g: any;
		}
	}
}

export function initialize() {
	global.g = g;
}

module.exports = initialize;
