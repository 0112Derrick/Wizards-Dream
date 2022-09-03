import ClientSyntheticEventEmitter from "./ClientSyntheticEventEmitter.js";
import { EventConstants } from "../constants/EventConstants.js";

export default class Observer extends EventTarget {
    //Override notify on the class that extends Observer
    notify(data) {
        console.log(`Notified of change to ${data}`);
    }

    addEventListner(event, callback, viewEventSource) {
        //de-couple the controller and view
        super.addEventListener(event, callback);//Register the event with the system.
        viewEventSource.addEventTarget(event, this);// Add this controller as the target of the event
    }

    listenForEvent(event: EventConstants, callback: EventListenerOrEventListenerObject | ((evt: CustomEvent) => { void }), eventSource: ClientSyntheticEventEmitter) {
        //Register the event with the system
        super.addEventListener(event, <EventListenerOrEventListenerObject>callback);

        //Add this event sink to the given source
        eventSource.addEventTarget(event, this);
    }
    
}
