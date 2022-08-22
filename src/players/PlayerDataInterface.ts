import { Character } from '../app/Character.js';

interface playerSignupDataInterface {
    username: string,
    email: string,
    password: string,
}

export interface playerStatusInterface {
    username: string,
    status: string,
}

export interface commonDataInterface {
    username: string,
}

export interface playerProfileDataInterface extends commonDataInterface {
    username: string,
    email: string,

}

export default interface playerDataInterface extends playerProfileDataInterface {
    characters: IcharacterDocument[];
}

export interface IcharacterDocument {
    name: string,
    id: string,
    level: number,
    class: string,
    guild: string,
    items: string[],
}

