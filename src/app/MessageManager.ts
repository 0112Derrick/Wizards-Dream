import { Socket } from "socket.io";
import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
declare const DOMPurify: any;
import $WordFilter from "./WordFilter.js";

export default class MessageManager {

    checkMessage(message: string, replaceStr = "*"): string {
        let cleanMessage: any = '';
        if (message) {
            const wordfilter = new $WordFilter();
            cleanMessage = DOMPurify.sanitize(message);
            if (wordfilter.isProfane(cleanMessage)) {
                console.log("profane");
                cleanMessage = wordfilter.replaceProfane(cleanMessage, replaceStr);
            } else {
                console.log("clean message");
            }
        }
        return cleanMessage;
    }

    checkMessageWithoutDOM(message: string, replaceStr = "*"): string {
        let cleanMessage: any = '';

        if (message) {
            const wordfilter = new $WordFilter();
            // cleanMessage = DOMPurify.sanitize(message);
            if (wordfilter.isProfane(message)) {
                console.log("profane");
                cleanMessage = wordfilter.replaceProfane(message, replaceStr);
            } else {
                console.log("clean message");
                cleanMessage = message;
            }
        }
        return cleanMessage;
    }

    sendMessage(message: string, user: string, socket: any, server: string) {
        let cleanMessage = this.checkMessage(message);
        socket.emit($socketRoutes.REQUEST_MESSAGE, server, cleanMessage, user);

    }
}