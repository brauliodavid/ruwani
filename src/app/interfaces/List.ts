export interface List {
    id?: string
    dateCreated: Date
    createdBy: {
        uid: string
        name: string
        email: string
    }
    name: string
    color: string
}

export const LIST_MOCK: List = {
    name: null,
    color: null,
    createdBy: {
        uid: null,
        name: null,
        email: null
    },
    dateCreated: null
}