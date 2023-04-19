import { ServerMessages as $ServerMessages } from "../constants/ServerMessages.js"
export class MessageHeader {
    adjustmentIteration: number = 0;
    tickAdjustment: number = 0;
    messageCount: number = 1;
    contents: Array<Message>;
    id: string | null

    constructor(adjustmentIteration: number, contents: Message | Array<Message> | null, id: string | null, tickAdjustment?: number) {
        this.adjustmentIteration = adjustmentIteration;
        // this.messageCount = messageCount;

        if (id) {
            this.id = id;
        }
        if (contents) {
            if (Array.isArray(contents)) {
                this.contents = [...contents];
            } else {
                this.contents = [contents];
            }
        }
        this.messageCount = this.contents.length;
    }

    updateContents(messages: Array<Message> | Message) {
        if (Array.isArray(messages)) {
            this.contents = [...messages];
        } else {
            this.contents = [messages];
        }

        this.messageCount = this.contents.length;
    }


}

export class Message {
    type: $ServerMessages = undefined;
    action: any = null;
    tick: number = 1;
    id: string

    constructor(type: $ServerMessages, action: any, tick: number, id: string) {
        this.type = type;
        this.action = action;
        this.tick = tick;
        this.id = id;
    }

    toJSON() {
        return {
            type: this.type,
            message: this.action,
            tick: this.tick,
            id: this.id,
        }
    }
}

