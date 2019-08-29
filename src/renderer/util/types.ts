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

export interface TokenLimit {
    head: string,
    tail: string
}