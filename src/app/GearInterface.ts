interface Gear {
    name: string,
    rarity: string,
    level: number,
    levelcap: number,
    //sprite: any,
    gearPosition: string,
    dropLocations: string[],
}
export interface HeadGear extends Gear {
    def: number,
    mdef: number,
    gearPosition: 'head'
}

export interface ChestGear extends Gear {
    def: number,
    mdef: number,
    gearPosition: 'chest'
}

export interface LegsGear extends Gear {
    def: number,
    mdef: number,
    gearPosition: 'legs'
}

export interface Weapons extends Gear {
    atk: number,
    matk: number,
    gearPosition: 'weapon'
}