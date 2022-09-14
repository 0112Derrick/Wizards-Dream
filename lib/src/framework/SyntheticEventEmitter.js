export default class SyntheticEventEmitter {
    eventMap;
    constructor() {
        this.eventMap = new Map();
    }
    addEventTarget(event, target) {
        if (this.eventMap.has(event)) {
            this.eventMap.get(event).push(target);
        }
        else {
            this.eventMap.set(event, new Array(target));
        }
    }
}
//# sourceMappingURL=SyntheticEventEmitter.js.map