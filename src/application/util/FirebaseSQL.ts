import * as firebase from "firebase-admin";

enum KEYWORDS {
    SELECT  = "SELECT",
    UPDATE  = "UPDATE",
    DELETE  = "DELETE",
    FROM    = "FROM",
    WHERE   = "WHERE",
    AND     = "AND",
    OR      = "OR",
    ">"     = ">"
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

class Tokens {

    private tokens: string[];
    private offset;

    constructor(s: string) {
        this.tokens = s.split(" ").filter(s => { return s.length });
        this.offset = 0;
    }

    public setOffset(offset: number) {
        this.offset = offset;
    }

    public getOffset() {
        return this.offset;
    }

    public getNextToken(asUppercase: boolean = false) {

        const token = this.tokens[this.offset];

        if(!token) {
            throw Error("Exhausted token array.");
        }

        this.offset += 1; // Start from the next index

        return asUppercase ? token.toUpperCase() : token;
    }
}

export default async function (query: string, firestore: firebase.firestore.Firestore) {

    console.info(query);

    const tokens = new Tokens(query);

    let fields = null, collection = null;

    // First token should be a clause that identifies the operation to perform.
    switch (tokens.getNextToken(true)) {
        case KEYWORDS.SELECT:

            let selectFields = tokens.getNextToken();

            // An asterisk denotes all fields.
            if(selectFields === '*') {

                fields = [];

            } else {

                const tmp = [];

                for(let x = tokens.getOffset();;x++) {
                    console.info("field", selectFields);
                    if(keywordsArray.indexOf(selectFields) !== -1) {
                        tokens.setOffset(x - 1);
                        break;
                    }

                    if(selectFields.length) {
                        tmp.push(selectFields);
                    }

                    selectFields = tokens.getNextToken();
                }

                // Fields are enclosed by parenthesis. This makes it easier to parse.



                //const sub = tmp.join(" ");

                for(const t of tmp) {
                    // TODO
                }

                fields = tmp;
            }

            break;
        case KEYWORDS.UPDATE:

            const collection = tokens[1];

            break;
        case KEYWORDS.DELETE:



            break;
        default:
            throw new Error("Unknown TODO");
    }

    switch (tokens.getNextToken(true)) {
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

    while(true) {
        let nextOptionalToken;

        try {
            nextOptionalToken = tokens.getNextToken(true);
        } catch (e) {
            break;
        }

        switch (nextOptionalToken) {
            case KEYWORDS.WHERE:
                const field = tokens.getNextToken(), operator = tokens.getNextToken(), value = tokens.getNextToken();

                constraints.push({ field, operator, value });

                break;
            default:
                throw Error("Uknown TODO");
        }
    }

    let fireQuery: firebase.firestore.Query = firestore.collection(collection);

    if(fields.length) {
        fireQuery = fireQuery.select(...fields);
    }

    constraints.forEach(constraint => {
        fireQuery = fireQuery.where(constraint.field, constraint.operator, constraint.value);
    });

    // TODO configure limir
    return fireQuery.limit(25).get();
};