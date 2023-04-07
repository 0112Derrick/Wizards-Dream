class MessageHeader {
    adjustmentIteration: number = 0;
    tickAdjustment: number = 0;
    messageCount: number = 1;
    content: Message | Array<Message>;

    constructor(adjustmentIteration, messageCount, contents: Message | Array<Message>) {
        this.adjustmentIteration = adjustmentIteration;
        this.messageCount = messageCount;
        if (Array.isArray(contents)) {
            this.content = [...contents];
        } else {
            this.content = [contents];
        }
    }
}

class Message {
    type: string = '';
    message: any;

    constructor(type: string, message) {
        this.type = type;
        this.message = message;
    }

    toJSON() {
        return {
            type: this.type,
            message: this.message,
        }
    }
}

