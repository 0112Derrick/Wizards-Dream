interface Gear {
    name: string,
    rarity: string,
    level: number,
    levelcap: number,
    //sprite: HTMLImageElement,
    gearPosition: GearPosition,
    dropLocations: string[],
}

enum GearPosition {
    HEAD,
    CHEST,
    LEGS,
    ACCESSORY_1,
    ACCESSORY_2,
    WEAPON_SLOT_1,
    WEAPON_SLOT_2,
    WEAPON_SLOT_BOTH,
}

export interface HeadGear extends Gear {
    def: number,
    mdef: number,
    gearPosition: GearPosition.HEAD,
}

export interface ChestGear extends Gear {
    def: number,
    mdef: number,
    gearPosition: GearPosition.CHEST,
}

export interface LegsGear extends Gear {
    def: number,
    mdef: number,
    gearPosition: GearPosition.LEGS,
}

interface Weapons extends Gear {
    atk: number,
    matk: number,
    gearPosition: GearPosition.WEAPON_SLOT_1 | GearPosition.WEAPON_SLOT_2 | GearPosition.WEAPON_SLOT_BOTH,
}

export interface Shield extends Weapons {
    def: number,
    mdef: number,
    gearPosition: GearPosition.WEAPON_SLOT_2,
}

export interface One_Hand_Weapon extends Weapons {
    gearPosition: GearPosition.WEAPON_SLOT_1,
}
export interface Two_Hand_Weapon extends Weapons {
    gearPosition: GearPosition.WEAPON_SLOT_BOTH,
}

export interface Accessory extends Gear {
    def: number,
    mdef: number,
    gearPosition: GearPosition.ACCESSORY_1 | GearPosition.ACCESSORY_2,
}

class CreateGear<Gear> {

}