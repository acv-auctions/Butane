import * as firebase from "firebase-admin";
import * as startOfDay from "date-fns/start_of_day";
import * as endOfDay from "date-fns/end_of_day";
import {AliasField, SqlDelimiter, SqlJoin} from "./types";
import format from "date-fns/format";

enum FUNCTIONS {
    UPPER
}

enum KEYWORDS {
    SELECT      = "select",
    INSERT      = "insert",
    UPDATE      = "update",
    DELETE      = "delete",
    FROM        = "from",
    WHERE       = "where",
    AND         = "and",
    SET         = "set",
    BETWEEN     = "between",
    DUPLICATE   = "duplicate",
    INTO        = "into",
    LIMIT       = "limit",
    JOIN        = "join",
    ALIAS       = "alias"
}

/*const keywordsArray: string[] = [
    KEYWORDS.SELECT,
    KEYWORDS.UPDATE,
    KEYWORDS.DELETE,
    KEYWORDS.FROM,
    KEYWORDS.WHERE,
    KEYWORDS.AND,
    KEYWORDS.OR
];*/

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
        this.tokenString = tokenString.replace(/ {2,}/g, ' ').trim();
        this.offset = 0;
    }

    private nextToken(delimiters?: SqlDelimiter): { token: string, offset: number } {

        let array = [];

        let offset = 0;
        let limitCount = 0;
        let hasReachedEnd = false;

        for(let x = this.offset; x < this.tokenString.length; x++) {

            const character = this.tokenString[x];
            const charCode = character.charCodeAt(0);

            if(delimiters) {

                if(!limitCount && charCode === 32) {
                    offset += array.length + 1;
                    continue;
                }

                // If the same character is used for both the head and tail, we only increment on the initial index.
                if(delimiters.head.charCodeAt(0) === delimiters.tail.charCodeAt(0)) {

                    if(x === this.offset) {
                        limitCount += 1;
                    } else if(charCode === delimiters.head.charCodeAt(0)) {
                        limitCount -= 1;
                    }

                } else {

                    if(charCode === delimiters.head.charCodeAt(0)) {

                        limitCount += 1;

                    } else if(charCode === delimiters.tail.charCodeAt(0)) {

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

                    if(delimiters.omit) {
                        array = array.slice(1, array.length - 1);
                    }

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

    public peek(tokenLimit?: SqlDelimiter) {
        return this.nextToken(tokenLimit).token;
    }

    public consume(tokenLimit?: SqlDelimiter) {

        if(this.offset >= this.tokenString.length) {
            throw new Error("Exhausted token array.");
        }

        const result = this.nextToken(tokenLimit);

        this.offset += result.offset;

        return result.token;
    }

    public stepBack(limit: number) {
        this.offset -= limit;
    }

    public stepForward(limit: number) {
        this.offset += limit;
    }
}

export default async function generator(query: string,
                               firestore: firebase.firestore.Firestore,
                               options: { joinPaths?: string[] } = {}) {

    const tokens = new Tokens(query);

    let operation: KEYWORDS.SELECT | KEYWORDS.INSERT | KEYWORDS.UPDATE | KEYWORDS.DELETE | KEYWORDS.DUPLICATE;

    const aliasedFields = {};

    let rootCollection: string = null;
    let subCollectionQueries: string[] = [];

    let rootFields: string[] = [];

    let documentBody = null;
    let documentIdToBeDuplicated = null;

    let limit = null;

    let currentKeyword;

    try {
        currentKeyword = tokens.consume(null);
    } catch (e) {
        throw new Error("Missing directive, e.g. SELECT, UPDATE, DELETE, etc.");
    }

    // First token should be a clause that identifies the operation to perform.
    switch (currentKeyword.toLowerCase()) {
        case KEYWORDS.SELECT:

            let selectFields = [];

            // Treat each token as a field until we reach a reserved keyword.
            while(true) {

                let nextToken = tokens.consume();

                if(nextToken.toLowerCase() === KEYWORDS.ALIAS) {

                    const columns = tokens.consume({ head: "(", tail: ")", omit: true })
                        .replace(/ {2,}/g, ' ')
                        .split(' ');

                    aliasedFields[columns[0]] = columns[1];
                    selectFields.push(columns[0]);
                    console.log(aliasedFields);
                    continue;

                } else if(nextToken.toLowerCase() === KEYWORDS.FROM) {

                    tokens.stepBack(nextToken.length + 1);
                    break;

                }

                selectFields.push(nextToken);
            }

            if(selectFields.filter(field => { return field === "*" }).length) {

                if(selectFields.length !== 1) {
                    throw new Error("Wildcard field cannot be combined with other fields.");
                }

                rootFields = [];

            } else {

                rootFields = selectFields;

            }

            operation = KEYWORDS.SELECT;

            break;
        case KEYWORDS.UPDATE:

            rootCollection = tokens.consume();

            operation = KEYWORDS.UPDATE;

            break;
        case KEYWORDS.DELETE:

            // TODO
            operation = KEYWORDS.DELETE;

            break;

        case KEYWORDS.DUPLICATE:

            documentIdToBeDuplicated = tokens.consume();

            operation = KEYWORDS.DUPLICATE;

            break;

        case KEYWORDS.INSERT: {

            const value = tokens.consume({ head: "{", tail: "}" });

            try {
                documentBody = tokenToType(new Tokens(value));
            } catch (e) {
                throw new Error("Error parsing provided object.");
            }

            operation = KEYWORDS.INSERT;

            break;
        }

        default:
            throw new Error(`Unknown keyword: ${currentKeyword}`);
    }

    currentKeyword = tokens.consume();

    switch (currentKeyword.toLowerCase()) {
        case KEYWORDS.SET:

            const value = tokens.consume({ head: "{", tail: "}" });

            try {
                documentBody = tokenToType(new Tokens(value));
            } catch (e) {
                throw new Error("Error parsing provided object.");
            }

            break;
        case KEYWORDS.FROM:

            if([ KEYWORDS.SELECT, KEYWORDS.DELETE ].indexOf(operation) === -1) {
                throw new Error(`Operation "${operation}" cannot be used with "FROM"`);
            }

            rootCollection = options.joinPaths ? `${options.joinPaths.join("/")}/${tokens.consume()}` : tokens.consume();
            break;

        case KEYWORDS.INTO:

            rootCollection = tokens.consume();

            const fireQuery: firebase.firestore.Query = firestore.collection(rootCollection);

            switch (operation) {
                case KEYWORDS.DUPLICATE: {

                    const doc = await (fireQuery as firebase.firestore.CollectionReference).doc(documentIdToBeDuplicated).get();

                    if(!doc.exists) {
                        throw Error("The provided document does not exist for the given collection.")
                    }

                    const ref: firebase.firestore.DocumentReference = (fireQuery as firebase.firestore.CollectionReference).doc();

                    ref.set(doc.data());

                    return null;
                }
                case KEYWORDS.INSERT: {
                    const docRef = (fireQuery as firebase.firestore.CollectionReference).doc();

                    await docRef.set(documentBody);

                    return null;
                }
                default:
                    throw new Error(`Operation "${operation}" cannot be used with "INTO"`);
            }

        default:
            throw new Error(`Unexpected token: ${currentKeyword}`);
    }

    join: while(true) {

        try {
            currentKeyword = tokens.consume();
        } catch (e) {
            break;
        }

        switch (currentKeyword.toLowerCase()) {
            case KEYWORDS.JOIN:

                subCollectionQueries.push(tokens.consume({ head: "(", tail: ")", omit: true }));

                break join;
            default:
                tokens.stepBack(currentKeyword.length + 1);
                break join;
        }
    }

    const constraints: {
        field: string;
        operator: firebase.firestore.Firestore.WhereFilterOp;
        value: any;
    }[] = [];

    let orderBy: { field: string, startDate: Date, endDate: Date } = null;

    for(let x = 0;; x++) {
        let nextOptionalToken;

        try {
            nextOptionalToken = tokens.consume();
        } catch (e) {
            break;
        }

        const nextOptionalTokenLower = nextOptionalToken.toLowerCase();

        switch (nextOptionalTokenLower) {
            case KEYWORDS.AND:
            case KEYWORDS.WHERE:
                const field = tokens.consume(), operator = tokens.consume().toLowerCase();

                // Not really needed, but whatever
                if(x === 0 && nextOptionalTokenLower !== KEYWORDS.WHERE) {
                    throw new Error(`Expected "WHERE" clause`);
                } else if(x > 0 && nextOptionalTokenLower !== KEYWORDS.AND) {
                    throw new Error(`Expected "AND" clause`);
                }

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

                if(operation !== KEYWORDS.SELECT) {
                    throw new Error(`"LIMIT" is only valid for "SELECT" operations`);
                }

                limit = tokenToType(tokens);
                break;
            default:
                throw Error(`Unexpected token: ${nextOptionalToken}`);
        }
    }

    let fireQuery: firebase.firestore.Query = firestore.collection(rootCollection);

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

        if(rootFields.length) {
            for(const key of Object.keys(documentData)) {
                if(rootFields.indexOf(key) !== -1) {
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
        if(rootFields.length) {
            fireQuery = fireQuery.select(...rootFields);
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

        if(operation === KEYWORDS.UPDATE) {
            if(constraints.length) {
                result.forEach(document => {
                    document.ref.set(documentBody, { merge: true })
                })
            } else {
                (await firestore.collection(rootCollection).get()).forEach(document => {
                    document.ref.set(documentBody, { merge: true })
                })
            }
        } else {

            const joinedDocuments = {};

            if(subCollectionQueries.length) {

                await Promise.all(result.docs.map(async documentSnapshot => {

                    const payloadsPromise = subCollectionQueries.map(async subCollectionQuery => {
                        const subQueryResult = await generator(subCollectionQuery, firestore, {
                            joinPaths: [ ...(options.joinPaths ? options.joinPaths : []), rootCollection, documentSnapshot.id ]
                        });
                        return subQueryResult.map(subDocument => { return subDocument.payload; });
                    });

                    const payloads = await Promise.all(payloadsPromise);

                    if(payloads.length) {
                        joinedDocuments[documentSnapshot.id] = payloads.flat();
                    }
                }));
            }

            return result.docs.map(documentSnapshot => {

                const combinedPayloads = [];

                // Spread so we can use the delete operator
                let documentPayload = {...documentSnapshot.data()};

                if(joinedDocuments[documentSnapshot.id]) {
                    joinedDocuments[documentSnapshot.id].forEach(joinedPayload => {
                        combinedPayloads.push({ ...documentPayload, ...joinedPayload });
                    });
                } else {
                    combinedPayloads.push(documentPayload);
                }

                return combinedPayloads.map(combinedPayload => {
                    Object.keys(combinedPayload).forEach(key => {
                        if(aliasedFields[key]) {
                            combinedPayload[aliasedFields[key]] = combinedPayload[key];
                            delete combinedPayload[key];
                        }
                    });

                    for(const key in combinedPayload) {

                        const property = combinedPayload[key];

                        if(property !== null
                            && typeof property === "object"
                            && property._seconds != null
                            && property._nanoseconds != null) {
                            combinedPayload[key] = format(new Date(property._seconds * 1000), "MM-DD-YYYY [at] hh:mm:ss A")
                        }
                    }

                    return {
                        id: documentSnapshot.id,
                        payload: combinedPayload,
                        path: documentSnapshot.ref.path
                    }
                });
            }).flat();
        }
    }
};
