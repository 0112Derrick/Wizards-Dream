import SyntheticEventEmitter from './SyntheticEventEmitter.js';
export default class ClientSyntheticEventEmitter extends SyntheticEventEmitter {
    constructor() {
        super();
    }
    dispatchEventLocal(event, data) {
        const targets = this.eventMap.get(event);
        const eventObj = new CustomEvent(event, { detail: data });
        if (targets) {
            for (const target of targets) {
                target.dispatchEvent(eventObj);
            }
        }
    }
}
//# sourceMappingURL=ClientSyntheticEventEmitter.js.map