import SyntheticEventEmitter from './SyntheticEventEmitter.js';
import { EventConstants } from '../constants/EventConstants.js';
export default class ClientSyntheticEventEmitter extends SyntheticEventEmitter {
    constructor() {
        super();
    }

    /**
     * Dispatches a "local" synthetic "event" to the targets who have registered to receive the "event"
     * @param event - The name of the event
     * @param data  - The data that should be sent with the event.
     */
    dispatchEventLocal(event: EventConstants, data: any) {
        const targets = this.eventMap.get(event);
        const eventObj = new CustomEvent(event, { detail: data });
        if (targets) {
            for (const target of targets) {
                target.dispatchEvent(eventObj);
            }
        }
    }
}