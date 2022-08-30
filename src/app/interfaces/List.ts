export interface List {
    id?: string
    type: string
    dateCreated?: Date
    createdBy?: {
        uid: string
        name: string
        email: string
    }
    name: string
    color?: string
    deadline?: Date
    labels?: string[]
}

export const LIST_MOCK: List = {
    name: null,
    type: null,
    color: null,
    createdBy: {
        uid: null,
        name: null,
        email: null
    },
    dateCreated: null,
    deadline: null,
    labels: []
}