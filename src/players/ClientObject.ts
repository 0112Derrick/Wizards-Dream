import { Character as $Character } from "../app/Character.js";
import { Direction as $Direction } from "../app/DirectionInput.js";
import $Queue from "../framework/Queue.js";
import { Socket } from "socket.io";

export class ClientObject {
    private socket: Socket = null;
    private clientOBJ: any = null;
    private activeCharacter: $Character = null;
    private inputHistory: $Queue<[number, string]> = new $Queue();
    constructor() { }

    //this function adds a tick and direction to the inputHistory
    addInput(tick: number, input: string) {
        this.inputHistory.add([tick, input]);
    }

    //Warning this function permanently deletes input history
    resetInputHistory() {
        this.inputHistory.emptyQueue();
        console.log("input history was emptied");
    }

    //Returns the client Object
    getClientOBJ(): any {
        return this.clientOBJ;
    }

    //Returns the active character for the client
    getActiveCharacter(): $Character {
        return this.activeCharacter;
    }

    //Returns the clients socket
    getClientSocket(): Socket {
        return this.socket;
    }
    //Sets the client Object
    setClientOBJ(clientObj): void {
        this.clientOBJ = clientObj;
    }
    //Sets clients the active character
    setActiveCharacter(activeCharacter: $Character): void {
        if (activeCharacter instanceof $Character)
            this.activeCharacter = activeCharacter;
    }
    //Sets the clients socket
    setClientSocket(socket: Socket): void {
        if (socket instanceof Socket)
            this.socket = socket;
    }
}
