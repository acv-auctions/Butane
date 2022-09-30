export enum FirestoreEntity {
    COLLECTION = "COLLECTION",
    DOCUMENT = "DOCUMENT"
}

export enum SessionViewType {
    SAVED = "SAVED", NEW = "NEW", DELETE = "DELETE"
}

export enum TabScene {
    ROCKET = "ROCKET", MARS = "MARS"
}

export enum DocumentActionType {
    DUPE, DELETE
}


export interface TerminalWord {
    value: string;
    properties?: WordProperties
}
