export enum CollectionType {
    COLLECTION = "COLLECTION",
    DOCUMENTS = "DOCUMENTS"
}

export enum SessionViewType {
    SAVED = "SAVED", NEW = "NEW", DELETE = "DELETE"
}

export enum DocumentActionType {
    DUPE, DELETE
}

export interface SqlDelimiter {
    head: string;
    tail: string;
    omit?: boolean
}

export interface AliasField {
    field: string;
    alias: string;
}
