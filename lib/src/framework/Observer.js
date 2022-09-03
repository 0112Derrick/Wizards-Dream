export default class Observer extends EventTarget {
    notify(data) {
        console.log(`Notified of change to ${data}`);
    }
    addEventListner(event, callback, viewEventSource) {
        super.addEventListener(event, callback);
        viewEventSource.addEventTarget(event, this);
    }
    listenForEvent(event, callback, eventSource) {
        super.addEventListener(event, callback);
        eventSource.addEventTarget(event, this);
    }
}
//# sourceMappingURL=Observer.js.map