"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Character = void 0;
var GameObject_js_1 = require("./GameObject.js");
var CharacterAttributesConstants_js_1 = require("../constants/CharacterAttributesConstants.js");
var Character = /** @class */ (function (_super) {
    __extends(Character, _super);
    function Character(config) {
        var _this = _super.call(this, config) || this;
        _this.movingProgressRemaining = 0;
        _this.isPlayerControlled = config.isPlayerControlled || false;
        _this.directionUpdate = {
            "up": ["y", -0.5],
            "down": ["y", 0.5],
            "left": ["x", -0.7],
            "right": ["x", 0.7],
            "jump": ["y", 0]
        };
        _this.characterID = config.characterID || 1;
        _this.username = config.username || 'newCharacter';
        _this.attributes = config.atrributes || new CharacterAttributes();
        _this["class"] = config["class"] || 'mage';
        _this.guild = config.guild || 'none';
        _this.items = config.items || [];
        return _this;
    }
    Character.prototype.update = function (state) {
        this.updatePosition();
        //console.log(state);
        this.updateSprite(state);
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && state.arrow) {
            this.direction = state.arrow;
            this.movingProgressRemaining = 16;
        }
    };
    Character.prototype.updatePosition = function () {
        if (this.movingProgressRemaining > 0) {
            var _a = this.directionUpdate[this.direction], property = _a[0], change = _a[1];
            this[property] += change;
            this.movingProgressRemaining -= 1;
        }
    };
    Character.prototype.updateSprite = function (state) {
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && !state.arrow) {
            this.sprite.setAnimation('idle-' + this.direction);
        }
        if (this.movingProgressRemaining > 0) {
            this.sprite.setAnimation('walk-' + this.direction);
        }
    };
    return Character;
}(GameObject_js_1.GameObject));
exports.Character = Character;
var CharacterAttributes = /** @class */ (function () {
    function CharacterAttributes(_Atk, _Matk, _Vit, _Men, _Dex) {
        if (_Atk === void 0) { _Atk = 1; }
        if (_Matk === void 0) { _Matk = 1; }
        if (_Vit === void 0) { _Vit = 1; }
        if (_Men === void 0) { _Men = 1; }
        if (_Dex === void 0) { _Dex = 1; }
        this.level = 1;
        this.experience = CharacterAttributesConstants_js_1.CharacterAttributesConstants.experience;
        this.experienceCap = CharacterAttributesConstants_js_1.CharacterAttributesConstants.experienceCap;
        this.statPoints = CharacterAttributesConstants_js_1.CharacterAttributesConstants.statPoints;
        this.hp = CharacterAttributesConstants_js_1.CharacterAttributesConstants.hp;
        this.sp = CharacterAttributesConstants_js_1.CharacterAttributesConstants.sp;
        this.def = CharacterAttributesConstants_js_1.CharacterAttributesConstants.def;
        this.mdef = CharacterAttributesConstants_js_1.CharacterAttributesConstants.mdef;
        this.crit = CharacterAttributesConstants_js_1.CharacterAttributesConstants.crit;
        this.Atk = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Atk;
        this.Matk = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Matk;
        this.Vit = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Vit;
        this.Men = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Men;
        this.Dex = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Dex;
        this.Atk = _Atk;
        this.Matk = _Matk;
        this.Vit = _Vit;
        this.Men = _Men;
        this.Dex = _Dex;
        if (this.experience >= this.experienceCap) {
            this.levelUp();
        }
    }
    CharacterAttributes.prototype.increaseExp = function (expAmount) {
        this.experience += expAmount;
        if (this.experience >= this.experienceCap) {
            this.levelUp();
        }
    };
    CharacterAttributes.prototype.levelUp = function () {
        if (this.experience >= this.experienceCap) {
            this.level += 1;
            this.statPoints += 3;
            this.experienceCap *= 1.8;
        }
    };
    CharacterAttributes.prototype.increaseStat = function (stat) {
        if (this.statPoints >= 1) {
            switch (stat) {
                case CharacterAttributesConstants_js_1.StatNames.ATK:
                    this.Atk += 1;
                    this.statPoints -= 1;
                    break;
                case CharacterAttributesConstants_js_1.StatNames.MATK:
                    this.Matk += 1;
                    this.statPoints -= 1;
                    break;
                case CharacterAttributesConstants_js_1.StatNames.MEN:
                    this.Men += 1;
                    this.statPoints -= 1;
                    break;
                case CharacterAttributesConstants_js_1.StatNames.VIT:
                    this.Vit += 1;
                    this.statPoints -= 1;
                    break;
                case CharacterAttributesConstants_js_1.StatNames.DEX:
                    this.Dex += 1;
                    this.statPoints -= 1;
                    break;
                default:
                    console.log("Enter a valid stat to increase");
            }
            ;
        }
    };
    CharacterAttributes.prototype.resetStats = function () {
        this.Atk = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Atk;
        this.Matk = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Matk;
        this.Vit = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Vit;
        this.Men = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Men;
        this.Dex = CharacterAttributesConstants_js_1.CharacterAttributesConstants.Dex;
        this.hp = CharacterAttributesConstants_js_1.CharacterAttributesConstants.hp;
        this.sp = CharacterAttributesConstants_js_1.CharacterAttributesConstants.sp;
        this.def = CharacterAttributesConstants_js_1.CharacterAttributesConstants.def;
        this.mdef = CharacterAttributesConstants_js_1.CharacterAttributesConstants.mdef;
        this.crit = CharacterAttributesConstants_js_1.CharacterAttributesConstants.crit;
    };
    Object.defineProperty(CharacterAttributes.prototype, "Level", {
        get: function () {
            return this.level;
        },
        set: function (_level) {
            if (_level < 1)
                _level = 1;
            this.level = _level;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "Experience", {
        get: function () {
            return this.experience;
        },
        set: function (_exp) {
            if (_exp < 1)
                _exp = 1;
            this.experience = _exp;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "ExperienceCap", {
        get: function () {
            return this.experienceCap;
        },
        set: function (_expCap) {
            if (_expCap < 1)
                _expCap = 1;
            this.experienceCap = _expCap;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "HP", {
        get: function () {
            return this.hp;
        },
        set: function (_hp) {
            if (_hp < 1)
                _hp = 1;
            this.hp = _hp;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "SP", {
        get: function () {
            return this.sp;
        },
        set: function (_sp) {
            if (_sp < 1)
                _sp = 1;
            this.sp = _sp;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "Def", {
        get: function () {
            return this.def;
        },
        set: function (_def) {
            if (_def < 1)
                _def = 1;
            this.def = _def;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "MDef", {
        get: function () {
            return this.mdef;
        },
        set: function (_mdef) {
            if (_mdef < 1)
                _mdef = 1;
            this.mdef = _mdef;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "Crit", {
        get: function () {
            return this.crit;
        },
        set: function (_crit) {
            if (_crit < 1)
                _crit = 1;
            this.crit = _crit;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "AtkAtrribute", {
        get: function () {
            return this.Atk;
        },
        set: function (AtkAttribute) {
            if (AtkAttribute < 1)
                AtkAttribute = 1;
            this.Atk = AtkAttribute;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "MAtkAtrribute", {
        get: function () {
            return this.Matk;
        },
        set: function (MatkAttribute) {
            if (MatkAttribute < 1)
                MatkAttribute = 1;
            this.Matk = MatkAttribute;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "MenAtrribute", {
        get: function () {
            return this.Men;
        },
        set: function (MenAttribute) {
            if (MenAttribute < 1)
                MenAttribute = 1;
            this.Men = MenAttribute;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "VitAtrribute", {
        get: function () {
            return this.Vit;
        },
        set: function (VitAttribute) {
            if (VitAttribute < 1)
                VitAttribute = 1;
            this.Vit = VitAttribute;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CharacterAttributes.prototype, "DexAtrribute", {
        get: function () {
            return this.Dex;
        },
        set: function (DexAttribute) {
            if (DexAttribute < 1)
                DexAttribute = 1;
            this.Dex = DexAttribute;
        },
        enumerable: false,
        configurable: true
    });
    return CharacterAttributes;
}());
