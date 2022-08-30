import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs';
import { List } from '../interfaces/List';
import { Task } from '../interfaces/Task';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    isTaskOpen = new BehaviorSubject<boolean>(false)
    taskData = new BehaviorSubject<Task>(null)
    taskList = new BehaviorSubject<List>(null)
    
    constructor() {}
    
}

