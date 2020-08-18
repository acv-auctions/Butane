import * as firebase from "firebase-admin";
import * as startOfDay from "date-fns/start_of_day";
import * as endOfDay from "date-fns/end_of_day";
import {TokenLimit} from "./types";
import format from "date-fns/format";

enum KEYWORDS {
    SELECT      = "select",
    INSERT      = "insert",
    UPDATE      = "update",
    DELETE      = "delete",
    FROM        = "from",
    WHERE       = "where",
    AND         = "and",
    OR          = "or",
    ">"         = ">",
    IN           = "IN",
    BETWEEN     = "between",
    DUPLICATE   = "duplicate",
    INTO        = "into",
    LIMIT       = "limit"
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

const tokenToType = (tokens: Tokens) => {

    const cautiousValue = tokens.peek();

    let valAsNumber = parseFloat(cautiousValue);
    let valAsDate = ISODateStringToDate(cautiousValue);

    if(cautiousValue === "null") {

        // "Skip" the value
        tokens.consume();
        return null;

    } else if(valAsDate) {

        // "Skip" the value
        tokens.consume();
        return valAsDate;

    } else if(!isNaN(valAsNumber)) {

        // "Skip" the value
        tokens.consume();
        return valAsNumber;

    } else if(["true", "false"].indexOf(cautiousValue) !== -1) {

        return tokens.consume() === "true";

    } else if(cautiousValue.startsWith("\"")) {

        return tokens.consume({ head: "\"", tail: "\"" }).slice(1, -1);

    } else if(cautiousValue.startsWith("{")) {

        try {
            return JSON.parse(tokens.consume({ head: "{", tail: "}" }));
        } catch (e) {
            throw new Error("Error parsing provided object.");
        }

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

    constructor(tokenString: string) {
        this.tokenString = tokenString.replace(/\s\s+/g, ' ').trim();
        this.offset = 0;
    }

    private stepForward(limit?: TokenLimit): { token: string, offset: number } {
        const array = [];

        let offset = 0;
        let limitCount = 0;
        let hasReachedEnd = false;

        for(let x = this.offset; x < this.tokenString.length; x++) {

            const character = this.tokenString[x];
            const charCode = character.charCodeAt(0);

            if(limit) {

                // If the same identifier is used for both the head and tail, we only increment on the initial index.
                if(limit.head.charCodeAt(0) === limit.tail.charCodeAt(0)) {

                    if(x === this.offset) {
                        limitCount += 1;
                    } else if(charCode === limit.head.charCodeAt(0)) {
                        limitCount -= 1;
                    }

                } else {

                    if(charCode === limit.head.charCodeAt(0)) {

                        limitCount += 1;

                    } else if(charCode == limit.tail.charCodeAt(0)) {

                        limitCount -= 1;

                    }
                }

                array.push(character);

                if(limitCount === 0) {

                    // Initial index must contain head
                    if(x === this.offset) {
                        throw new Error("WAT?!");
                    }

                    offset += array.length + 1;
                    break;
                }

            } else {
                if(charCode === 32) {
                    offset += array.length + 1;
                    break;
                }

                array.push(character);
            }

            if(x === this.tokenString.length - 1) {
                hasReachedEnd = true;
            }
        }

        if(this.tokenString[offset]) {
            /*while(this.tokenString.charCodeAt(offset) === 32) {
                offset += 1;
            }*/
        }

        return { token: array.join(""), offset: hasReachedEnd ? this.tokenString.length : offset };
    }

    public peek(tokenLimit?: TokenLimit) {
        return this.stepForward(tokenLimit).token;
    }

    public consume(tokenLimit?: TokenLimit, errorMessage?: string) {

        if(this.offset >= this.tokenString.length) {
            throw new Error(errorMessage ? errorMessage : "Exhausted token array.");
        }

        const result = this.stepForward(tokenLimit);

        this.offset += result.offset;

        return result.token;
    }
}

export default async function (query: string, firestore: firebase.firestore.Firestore) {

    const tokens = new Tokens(query);

    let fields: string[] = null, collection = null;
    let updateDocument = null;
    let duplicateDocument = null, newDocument = null;
    let limit = null;

    let bridgeToken = null;

    const initialToken = tokens.consume(null, "Missing directive, e.g. SELECT, UPDATE, DELETE, etc.");

    // First token should be a clause that identifies the operation to perform.
    switch (initialToken.toLowerCase()) {
        case KEYWORDS.SELECT:

            let selectFields = [];

            let nextToken = tokens.consume();

            // Treat each token as a field until we reach a reserved keyword.
            while(keywordsArray.indexOf(nextToken.toLowerCase()) === -1) {

                selectFields.push(nextToken);

                nextToken = tokens.consume();
            }

            // We can remember this identifier for later use.
            bridgeToken = nextToken;

            if(selectFields.filter(field => { return field === "*" }).length) {

                if(selectFields.length !== 1) {
                    throw new Error("");
                }

                fields = [];

            } else {

                fields = selectFields;

            }

            break;
        case KEYWORDS.UPDATE:

            const collection = tokens.consume();

            break;
        case KEYWORDS.DELETE:



            break;

        case KEYWORDS.DUPLICATE:

            duplicateDocument = tokens.consume();

            break;

        case KEYWORDS.INSERT: {

            let value = tokens.consume({ head: "{", tail: "}" });

            //value = tokenToType(new Tokens(value));

            //const operator = tokens.consume();

            //const collection = tokens.consume();

            //console.info(value, operator, collection);
            try {
                newDocument = tokenToType(new Tokens(value));
            } catch (e) {
                throw new Error("Error parsing provided object.");
            }

            //return;
            break;
        }

        default:
            throw new Error(`Unknown keyword: ${initialToken}`);
    }

    const collectionToken = bridgeToken ? bridgeToken : tokens.consume();

    switch (collectionToken.toLowerCase()) {
        case KEYWORDS.FROM:
            collection = tokens.consume();
            break;

        case KEYWORDS.INTO:

            if(!newDocument) {
                throw new Error(`Keyword '${KEYWORDS.INTO}' is not available for the given query.`);
            }

            collection = tokens.consume();
            break;

        default:
            throw new Error(`Unexpected token: ${collectionToken}`);
    }

    const constraints: {
        field: string;
        operator: firebase.firestore.Firestore.WhereFilterOp;
        value: any;
    }[] = [];

    // let whereUsed = false;
    let orderBy: { field: string, startDate: Date, endDate: Date } = null;

    console.log("Here!");

    while(true) {
        let nextOptionalToken;

        try {
            nextOptionalToken = tokens.consume();
        } catch (e) {
            break;
        }

        switch (nextOptionalToken.toLowerCase()) {
            case KEYWORDS.AND:
            case KEYWORDS.WHERE:
                const field = tokens.consume(), operator = tokens.consume().toLowerCase();

                /*if(nextOptionalToken === KEYWORDS.WHERE) {
                    whereUsed = true;
                } else if(nextOptionalToken === KEYWORDS.AND && !whereUsed) {
                    throw Error("");
                }*/

                if(operator === KEYWORDS.BETWEEN) {
                    let left: any = tokens.consume(), right: any = tokens.consume();

                    left = ISODateStringToDate(left);
                    right = ISODateStringToDate(right);

                    if(!left || !right) {
                        throw Error(`Invalid date(s) provided for '${KEYWORDS.BETWEEN}' operator.`);
                    }

                    orderBy = { field, startDate: startOfDay(left), endDate: endOfDay(right) };

                    continue;
                }

                let value = tokenToType(tokens);

                constraints.push({ field, operator, value });

                break;
            case KEYWORDS.LIMIT:
                limit = tokenToType(tokens);
                break;
            default:
                throw Error(`Unexpected token: ${nextOptionalToken}`);
        }
    }

    console.log("And here!");

    let fireQuery: firebase.firestore.Query = firestore.collection(collection);

    if(newDocument) {
        const docRef = (fireQuery as firebase.firestore.CollectionReference).doc();

        await docRef.set(newDocument);

        return null;
    }

    if(duplicateDocument) {
        const doc = await (fireQuery as firebase.firestore.CollectionReference).doc(duplicateDocument).get();

        if(!doc.exists) {
            throw Error("The provided document does not exist for the given collection.")
        }

        const ref: firebase.firestore.DocumentReference = (fireQuery as firebase.firestore.CollectionReference).doc();

        ref.set(doc.data());

        return null; // TODO
    }

    const optionalDocumentId = constraints
        .filter(constraint => {
            return constraint.field === "DOCID";
        }).map(constraint => {
            return constraint.value;
        });

    if(optionalDocumentId.length) {

        if(optionalDocumentId.length > 1) {
            throw Error("Cannot combine filters with 'DOCID'.");
        }

        const doc = await (fireQuery as firebase.firestore.CollectionReference).doc(optionalDocumentId[0]).get();

        if(!doc.exists) {
            throw Error("The provided document does not exist for the given collection.")
        }

        const documentData = doc.data();
        let payload = {};

        if(fields.length) {
            for(const key of Object.keys(documentData)) {
                if(fields.indexOf(key) !== -1) {
                    payload[key] = documentData[key];
                }
            }
        } else {
            payload = documentData;
        }

        return [{
            id: doc.id,
            payload,
            path: doc.ref.path
        }]

    } else {
        if(fields.length) {
            fireQuery = fireQuery.select(...fields);
        }

        constraints.forEach(constraint => {
            fireQuery = fireQuery.where(constraint.field, constraint.operator, constraint.value);
        });

        if(orderBy) {
            fireQuery = fireQuery.orderBy(orderBy.field).startAt(orderBy.startDate).endAt(orderBy.endDate);
        }

        if(limit) {
            fireQuery = fireQuery.limit(limit);
        }

        const result = await fireQuery.get();

        return result.docs.map(documentSnapshot => {

            const payload = documentSnapshot.data();

            for(const key in payload) {
                if(typeof payload[key] === "object"
                    && payload[key]._seconds !== undefined
                    && payload[key]._nanoseconds !== undefined) {
                    payload[key] = format(new Date(payload[key]._seconds * 1000), "MM-DD-YYYY [at] hh:mm:ss A")
                }
            }

            return {
                id: documentSnapshot.id,
                payload,
                path: documentSnapshot.ref.path
            }
        });
    }
};
