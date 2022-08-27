export interface Task {
    id?: string
    dateId: string // YYYY-MM-DD
    title: string
    details: string
    dateCreated: Date
    dateUpdated: Date
    createdBy: {
        uid: string
        name: string
        email: string
    }
    checked: boolean
    labels: string[]
    date: Date
    hasTime: boolean // if must show time
    repeat: {
        interval: number
        intervalType: string
    }
    list: {
        id: string
        name: string
    }
}

export const TASK_MOCK: Task = {
    title: null,
    dateId: null,
    details: null,
    dateCreated: null,
    dateUpdated: null,
    createdBy: {
        uid: null,
        name: null,
        email: null,
    },
    checked: false,
    labels: [],
    date: null,
    hasTime: false, // if must show time
    repeat: null,
    list: null,
}