import {KEYWORDS} from "./FirebaseSQL";

interface WordOptions {
    color: string;
}

let sqlWordFormatOptions: { [key: string]: WordOptions } = Object.values(KEYWORDS).reduce((acc, val) => {

    let options;

    switch (val) {
        case KEYWORDS.SELECT:
        case KEYWORDS.FROM:
        case KEYWORDS.WHERE:
        case KEYWORDS.AND:
        case KEYWORDS.INSERT:
        case KEYWORDS.INTO:
        case KEYWORDS.BETWEEN:
        case KEYWORDS.DELETE:
            options = {
                color: "#c5ca1b"
            }
            break;
        case KEYWORDS.LIMIT:
            options = {
                color: "#1bbbca"
            }
            break;
        case KEYWORDS.JOIN:
            options = {
                color: "#ee13ea"
            }
    }
    acc[val] = options;
    return acc;
}, {});

const userWordFormatOptions: { [key: string]: WordOptions } = {
    "*": {
        color: "#20bc23"
    }
}

export default { ...sqlWordFormatOptions, ...userWordFormatOptions };
