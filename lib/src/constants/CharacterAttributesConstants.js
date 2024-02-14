export const CharacterAttributesConstants = {
    experience: 1,
    experienceCap: 200,
    statPoints: 5,
    hp: 15,
    sp: 10,
    def: 1,
    mdef: 1,
    crit: 1,
    Atk: 1,
    Matk: 1,
    Vit: 1,
    Men: 1,
    Dex: 1,
    hpCap: 15,
    spCap: 10
};
export var StatNames;
(function (StatNames) {
    StatNames[StatNames["ATK"] = 1] = "ATK";
    StatNames[StatNames["MATK"] = 2] = "MATK";
    StatNames[StatNames["VIT"] = 3] = "VIT";
    StatNames[StatNames["MEN"] = 4] = "MEN";
    StatNames[StatNames["DEX"] = 5] = "DEX";
})(StatNames || (StatNames = {}));
export const CharacterSize = {
    width: 32,
    height: 32,
};
export const CharacterVelocity = {
    xVelocity: 2,
    yVelocity: 2,
};
//# sourceMappingURL=CharacterAttributesConstants.js.map