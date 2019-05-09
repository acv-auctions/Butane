import * as firebase from "firebase-admin";
import * as startOfDay from "date-fns/start_of_day";
import * as endOfDay from "date-fns/end_of_day";

enum KEYWORDS {
    CREATE      = "create",
    SELECT      = "select",
    INSERT      = "insert",
    UPDATE      = "update",
    DELETE      = "delete",
    FROM        = "from",
    WHERE       = "where",
    AND         = "and",
    OR          = "or",
    ">"         = ">",
    BETWEEN     = "between",
    DUPLICATE   = "duplicate"
}

const keywordsArray: string[] = [
    KEYWORDS.SELECT,
    KEYWORDS.UPDATE,
    KEYWORDS.DELETE,
    KEYWORDS.FROM,
    KEYWORDS.WHERE,
    KEYWORDS.AND,
    KEYWORDS.OR,
    KEYWORDS[">"]
];

const tokenToType = (tokenValue: string, tokens: Tokens) => {

    let valAsNumber = parseFloat(tokenValue);
    let valAsDate = ISODateStringToDate(tokenValue);

    if(tokenValue === "null") {

        return null;

    } else if(valAsDate) {

        return valAsDate;

    } else if(!isNaN(valAsNumber)) {

        return valAsNumber;

    } else if(["true", "false"].indexOf(tokenValue) !== -1) {

        return tokenValue === "true";

    } else if(tokenValue.startsWith("\"")) {

        tokens.stepBackwards();
        tokens.setOffset(tokens.getOffset() + 1);

        return tokens.getNextToken("\"");

    } else if(tokenValue.startsWith("{")) {

        const result: any = {};

        tokens.stepBackwards();
        tokens.setOffset(tokens.getOffset() + 1);

        const keyValues = tokens.getNextToken("}");

        for(const token of keyValues.split(" ")) {
            const s = token.split(":");

            const key = s[0], val = s[1];

            if(!key || !val) {
                throw new Error("");
            }

            result[key] = tokenToType(val, new Tokens(val));
        }

        return result;

    } else {
        throw Error("Unknown value type.");
    }
};

const ISODateStringToDate = (str: string) => {
    const regexp = new RegExp(/^\d{4}-\d{2}-\d{2}$/);

    if(!str.match(regexp)) {
        return null;
    }

    const s = str.split("-");

    return new Date(parseInt(s[0]), parseInt(s[1]) - 1, parseInt(s[2]));
};

class Tokens {

    private tokenString: string;
    private offset: number;
    private previousToken: string;

    constructor(tokenString: string) {
        this.tokenString = tokenString.replace(/\s\s+/g, ' ');
        this.offset = 0;
    }

    public setOffset(offset: number) {
        this.offset = offset;
    }

    public getOffset() {
        return this.offset;
    }

    public stepBackwards() {

        if(!this.previousToken) {
            return;
        }

        this.offset = this.offset - this.previousToken.length - 1;
        this.previousToken = null;
    }

    public getNextToken(stopCharacter?: string) {

        const array = [];

        for(let x = this.offset; x < this.tokenString.length; x++) {

            const c = this.tokenString[x];

            if(stopCharacter) {

                if(c.charCodeAt(0) === stopCharacter.charCodeAt(0)) {
                    this.offset += array.length + 2;
                    break;
                }

            } else if(c.charCodeAt(0) === 32) {
                this.offset += array.length + 1;
                break;

            }

            array.push(c);
        }

        //this.offset += array.length + 1;

        if(!array.length) {
            throw new Error("Exhausted token array.");
        }

        const token = array.join("").trim();

        this.previousToken = token;

        return token;
    }
}

export default async function (query: string, firestore: firebase.firestore.Firestore) {

    const tokens = new Tokens(query);

    let fields = null, collection = null, duplicateDocument = null;

    // First token should be a clause that identifies the operation to perform.
    switch (tokens.getNextToken().toLowerCase()) {
        case KEYWORDS.SELECT:

            let selectFields = [];

            let nextToken = tokens.getNextToken();

            while(keywordsArray.indexOf(nextToken.toLowerCase()) === -1) {

                selectFields.push(nextToken);

                nextToken = tokens.getNextToken();
            }

            if(selectFields.filter(field => { return field === "*" }).length) {

                if(selectFields.length !== 1) {
                    throw new Error("");
                }

                fields = [];

            } else {

                fields = selectFields;

            }

            tokens.stepBackwards();

            break;
        case KEYWORDS.UPDATE:

            const collection = tokens[1];



            break;
        case KEYWORDS.DELETE:



            break;

        case KEYWORDS.DUPLICATE:

            duplicateDocument = tokens.getNextToken();

            break;

        case KEYWORDS.INSERT: {

            tokens.setOffset(tokens.getOffset() + 1);

            const value = tokens.getNextToken("}");

            const o = tokens.getNextToken();

            const collection = tokens.getNextToken();

            console.info(value, o, collection);

            return;
        }

        default:
            throw new Error("Unknown TODO");
    }

    switch (tokens.getNextToken().toLowerCase()) {
        case KEYWORDS.FROM:

            collection = tokens.getNextToken();

            break;
        default:
            throw new Error("Unknown TODO");
    }

    const constraints: {
        field: string;
        operator: firebase.firestore.Firestore.WhereFilterOp;
        value: any;
    }[] = [];

    let whereUsed = false;
    let orderBy: { field: string, startDate: Date, endDate: Date } = null;

    while(true) {
        let nextOptionalToken;

        try {
            nextOptionalToken = tokens.getNextToken();
        } catch (e) {
            console.info(constraints);
            break;
        }

        switch (nextOptionalToken.toLowerCase()) {
            case KEYWORDS.AND:
            case KEYWORDS.WHERE:
                const field = tokens.getNextToken(), operator = tokens.getNextToken().toLowerCase();

                if(nextOptionalToken === KEYWORDS.WHERE) {
                    whereUsed = true;
                } else if(nextOptionalToken === KEYWORDS.AND && !whereUsed) {
                    throw Error("");
                }

                if(operator === KEYWORDS.BETWEEN) {
                    let left: any = tokens.getNextToken(), right: any = tokens.getNextToken();

                    left = ISODateStringToDate(left);
                    right = ISODateStringToDate(right);

                    if(!left || !right) {
                        throw Error("");
                    }

                    orderBy = { field, startDate: startOfDay(left), endDate: endOfDay(right) };

                    continue;
                }

                let value = tokenToType(tokens.getNextToken(), tokens);

                console.info("Constraint value", value);

                constraints.push({ field, operator, value });

                break;
            default:
                throw Error("Unknown TODO");
        }
    }

    let fireQuery: firebase.firestore.Query = firestore.collection(collection);

    if(duplicateDocument) {
        const doc = await (fireQuery as firebase.firestore.CollectionReference).doc(duplicateDocument).get();

        if(!doc.exists) {
            throw Error("TODO")
        }

        const ref: firebase.firestore.DocumentReference = firestore.collection(collection).doc();

        ref.set(doc.data());

        return null; // TODO
    }

    if(fields.length) {
        fireQuery = fireQuery.select(...fields);
    }

    constraints.forEach(constraint => {
        fireQuery = fireQuery.where(constraint.field, constraint.operator, constraint.value);
    });

    if(orderBy) {
        fireQuery = fireQuery.orderBy(orderBy.field).startAt(orderBy.startDate).endAt(orderBy.endDate);
    }

    // TODO configure limit
    return fireQuery.limit(25).get();
};