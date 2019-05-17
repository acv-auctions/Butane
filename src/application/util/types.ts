export enum CollectionType {
    COLLECTION = "COLLECTION",
    DOCUMENTS = "DOCUMENTS"
}

export enum SessionViewType {
    SAVED = "SAVED", NEW = "NEW"
}

export interface CollectionWrapper {
    id: string;
    list: any[];
    type: CollectionType
}

export interface CollectionWrapperEvent {
    id: string;
    index: number;
}

export interface TokenLimit {
    head: string,
    tail: string
}