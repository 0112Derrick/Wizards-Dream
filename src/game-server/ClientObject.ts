import { Character as $Character } from "../app/Character.js";
import { Direction as $Direction } from "../app/DirectionInput.js";
import $Queue from "../framework/Queue.js";
import { Socket } from "socket.io";
import { characterDataInterface as $characterDataInterface } from "./interfaces/CharacterDataInterface.js";
import { Skill as $Skill } from "../app/Skill.js";
import { SkillI as $SkillI } from "./interfaces/SkillInterface.js";

export class ClientObject {
    private socket: Socket = null;
    private clientOBJ: any = null;
    private activeCharacter: $characterDataInterface = null;
    private inputHistory: $Queue<[number, string]> = new $Queue();
    private usableSkills: $Skill[] = [];
    private skillsTree: $SkillI[] = [];
    private adjustmentIteration: number = 0;
    private clientTickAdjustment: Map<number, number> = new Map<number, number>();
    constructor() { }

    //this function adds a tick and direction to the inputHistory
    addInput(tick: number, input: string): void {
        this.inputHistory.add([tick, input]);
    }

    setAdjustmentIteration(iteration: number): void {
        this.adjustmentIteration = iteration;
    }

    setSkillTree(skillTree: $SkillI[]): void {
        this.skillsTree = skillTree;
    }

    getSkillTree(): $SkillI[] {
        return this.skillsTree;
    }

    isSkillTreeEmpty(): boolean {
        if (this.skillsTree.length == 0) {
            return true;
        }
        return false;
    }

    setUsableSkill(skill: $Skill) {
        this.usableSkills.push(skill);
        //this.activeCharacter.unlockedSkills.push(skill);
    }

    setUsableSkills(skills: $Skill[]) {
        skills.forEach(skill => {
            console.log("usable skill array:" + this.usableSkills)
            this.usableSkills.push(skill);

            //this.activeCharacter.unlockedSkills.push(skill);
        });
    }

    findUsableSkill(skillName: string): $SkillI {
        let skill = this.usableSkills.find((skill) => {
            console.log(typeof skill.Name + " " + typeof skillName);
            return skill.Name.toLowerCase() == skillName.toLowerCase();
        });

        return skill;
    }

    getAdjustmentIteration(): number {
        return this.adjustmentIteration;
    }

    incrementAdjustmentIteration(): void {
        this.adjustmentIteration++;
    }

    //Warning this function permanently deletes input history
    resetInputHistory(): void {
        this.inputHistory.emptyQueue();
        console.log("input history was emptied");
    }

    //Returns the client Object
    getClientOBJ(): any {
        return this.clientOBJ;
    }

    //Returns the active character for the client
    getActiveCharacter(): $characterDataInterface {
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
    setActiveCharacter(activeCharacter: $characterDataInterface): void {
        if (activeCharacter) {
            this.activeCharacter = activeCharacter;
        }
    }

    //Sets the clients socket
    setClientSocket(socket: Socket): void {
        if (socket instanceof Socket)
            this.socket = socket;
    }

    setAdjustedTick(adjustmentIteration: number, tickAdjustment: number): void {
        if (this.clientTickAdjustment.has(adjustmentIteration)) {
            console.log("Iteration value already set - ClientObject.js");
            return;
        }
        this.clientTickAdjustment.set(adjustmentIteration, tickAdjustment);
    }

    getAdjustedTick(iteration: number) {
        return this.clientTickAdjustment.get(iteration);
    }
}
