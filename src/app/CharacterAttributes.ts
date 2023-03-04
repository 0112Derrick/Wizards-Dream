import { CharacterAttributesConstants as $chAttr, StatNames as $stats } from '../constants/CharacterAttributesConstants.js';

export class CharacterAttributes {
    private level = 1;

    private experience = $chAttr.experience;
    private experienceCap = $chAttr.experienceCap;
    private statPoints = $chAttr.statPoints;
    private hp = $chAttr.hp;
    private sp = $chAttr.sp;
    private def = $chAttr.def;
    private mdef = $chAttr.mdef;
    private crit = $chAttr.crit;

    private Atk = $chAttr.Atk;
    private Matk = $chAttr.Matk;
    private Vit = $chAttr.Vit;
    private Men = $chAttr.Men;
    private Dex = $chAttr.Dex;

    constructor(_Atk: number = 1, _Matk: number = 1, _Vit: number = 1, _Men: number = 1, _Dex: number = 1) {
        this.Atk = _Atk;
        this.Matk = _Matk;
        this.Vit = _Vit;
        this.Men = _Men;
        this.Dex = _Dex;

        if (this.experience >= this.experienceCap) {
            this.levelUp();
        }

    }

    increaseExp(expAmount: number) {
        this.experience += expAmount;
        if (this.experience >= this.experienceCap) {
            this.levelUp();
        }
    }

    levelUp() {
        if (this.experience >= this.experienceCap) {
            this.level += 1;
            this.statPoints += 3;
            this.experienceCap *= 1.8;
        }
    }

    increaseStat(stat: $stats) {
        if (this.statPoints >= 1) {
            switch (stat) {
                case $stats.ATK:
                    this.Atk += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.MATK:
                    this.Matk += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.MEN:
                    this.Men += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.VIT:
                    this.Vit += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.DEX:
                    this.Dex += 1;
                    this.statPoints -= 1;
                    break;
                default:
                    console.log("Enter a valid stat to increase");
            };

        }
    }

    resetStats() {
        this.Atk = $chAttr.Atk;
        this.Matk = $chAttr.Matk;
        this.Vit = $chAttr.Vit;
        this.Men = $chAttr.Men;
        this.Dex = $chAttr.Dex;
        this.hp = $chAttr.hp;
        this.sp = $chAttr.sp;
        this.def = $chAttr.def;
        this.mdef = $chAttr.mdef;
        this.crit = $chAttr.crit;
    }

    public get Level(): number {
        return this.level;
    }

    public set Level(_level: number) {
        if (_level < 1)
            _level = 1;
        this.level = _level;
    }

    public get Experience(): number {
        return this.experience;
    }

    public set Experience(_exp: number) {
        if (_exp < 1)
            _exp = 1;
        this.experience = _exp;
    }

    public get ExperienceCap(): number {
        return this.experienceCap;
    }

    public set ExperienceCap(_expCap: number) {
        if (_expCap < 1)
            _expCap = 1;
        this.experienceCap = _expCap;
    }


    public get HP(): number {
        return this.hp;
    }

    public set HP(_hp: number) {
        if (_hp < 1)
            _hp = 1;
        this.hp = _hp;
    }

    public get SP(): number {
        return this.sp;
    }

    public set SP(_sp: number) {
        if (_sp < 1)
            _sp = 1;
        this.sp = _sp;
    }

    public get Def(): number {
        return this.def;
    }

    public set Def(_def: number) {
        if (_def < 1)
            _def = 1;
        this.def = _def;
    }

    public get MDef(): number {
        return this.mdef;
    }

    public set MDef(_mdef: number) {
        if (_mdef < 1)
            _mdef = 1;
        this.mdef = _mdef;
    }

    public get Crit(): number {
        return this.crit;
    }

    public set Crit(_crit: number) {
        if (_crit < 1)
            _crit = 1;
        this.crit = _crit;
    }

    public get AtkAtrribute(): number {
        return this.Atk;
    }

    public set AtkAtrribute(AtkAttribute: number) {
        if (AtkAttribute < 1)
            AtkAttribute = 1;
        this.Atk = AtkAttribute;
    }

    public get MAtkAtrribute(): number {
        return this.Matk;
    }

    public set MAtkAtrribute(MatkAttribute: number) {
        if (MatkAttribute < 1)
            MatkAttribute = 1;
        this.Matk = MatkAttribute;
    }

    public get MenAtrribute(): number {
        return this.Men;
    }

    public set MenAtrribute(MenAttribute: number) {
        if (MenAttribute < 1)
            MenAttribute = 1;
        this.Men = MenAttribute;
    }

    public get VitAtrribute(): number {
        return this.Vit;
    }

    public set VitAtrribute(VitAttribute: number) {
        if (VitAttribute < 1)
            VitAttribute = 1;
        this.Vit = VitAttribute;
    }

    public get DexAtrribute(): number {
        return this.Dex;
    }

    public set DexAtrribute(DexAttribute: number) {
        if (DexAttribute < 1)
            DexAttribute = 1;
        this.Dex = DexAttribute;
    }

}
