export enum CollectionType {
    COLLECTION,
    DOCUMENTS
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