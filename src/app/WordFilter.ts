
export default class WordFilter {
    badWords: Array<string> = [
        "abbo",
        "abo",
        "all lives matter",
        "beeyotch",
        "biatch",
        "bitch",
        "bitch-ass",
        "chinaman",
        "chinamen",
        "chink",
        "coolie",
        "coon",
        "crazie",
        "crazy",
        "crip",
        "cuck",
        "cunt",
        "dago",
        "daygo",
        "dego",
        "dick",
        "douchebag",
        "dumb",
        "dyke",
        "eskimo",
        "fag",
        "f@g",
        "f@ggot",
        "fagg0t",
        "faggot",
        "fatass",
        "fatso",
        "gash",
        "gimp",
        "gip",
        "golliwog",
        "gook",
        "gyp",
        "gypsy",
        "half-breed",
        "halfbreed",
        "heeb",
        "homo",
        "hooker",
        "hoe",
        "hoe-ass",
        "idiot",
        "insane",
        "insanitie",
        "hate jews",
        "hate gays",
        "hate lesbians",
        "hate blacks",
        "hate mexicans",
        "self delete",
        "self-delete",
        "self-harm",
        "kill yo self",
        "go die",
        "jap",
        "kaffer",
        "kaffir",
        "kaffir",
        "kaffre",
        "kafir",
        "kike",
        "kraut",
        "lardass",
        "lesbo",
        "lunatic",
        "mick",
        "negress",
        "negro",
        "nig",
        "nig-nog",
        "nigga",
        "nigger",
        "nigguh",
        "nip",
        "pajeet",
        "paki",
        "pickaninnie",
        "pickaninny",
        "prostitute",
        "pussie",
        "pussy",
        "raghead",
        "retard",
        "sambo",
        "shemale",
        "skank",
        "slut",
        "soyboy",
        "spade",
        "sperg",
        "spic",
        "spook",
        "squaw",
        "street-shitter",
        "tard",
        "tits",
        "titt",
        "trannie",
        "tranny",
        "twat",
        "wetback",
        "whore",
        "wigger",
        "wop",
        "yid",
        "zog"
    ];
    tempBadWords: Array<string> = [];
    badWordsPattern = new RegExp(`\\b(${this.badWords.join('|')})\\b`, 'gi');
    constructor() {

    };
    addWords(words: string[]): void {
        words.forEach((word) => {
            console.log(`Word ${word} was added to the bad words list.`)
        })
        this.badWords = this.badWords.concat(words);
    };
    removeWord(word: string): void {
        let index = this.badWords.findIndex(testWord => word === testWord)
        if (index != -1) {
            this.badWords.splice(index, 1);
            console.log(`removed ${word} from badwords list.`);
        }
    };
    clearList(): void {
        console.log("Emptied bad words list.");
        this.tempBadWords = this.tempBadWords.concat(this.badWords);
        this.badWords = [];
    };
    restoreBadWords(): void {
        this.badWords = this.badWords.concat(this.tempBadWords);
    };

    isProfane(text: string): boolean {
        for (let word of this.badWords) {
            if (text.toLowerCase().includes(word)) {
                return true;
            }
        }
        return false;
    };

    findBadWords(text: string) {
        let foundBadWords = [];
        foundBadWords = text.toLowerCase().match(this.badWordsPattern);
        return foundBadWords;
    }

    replaceProfane(text: string, replaceChar?: string): string {
        console.log("user input: " + text);
        if (this.isProfane(text)) {

            let badWordsMatched = this.findBadWords(text);
            let filteredText = text;

            for (let word of badWordsMatched) {
                const replacement = replaceChar.repeat(word.length);
                filteredText = filteredText.replace(word, replacement);
            }

            console.log("Filtered message:", filteredText);
            return filteredText;
        };

        return text;
    };
}
