import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Task } from '../../interfaces/Task';
import { FunctionsService } from '../../services/functions.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})
export class TasksComponent implements OnInit {

	@Input() tasks: Task[] = []
	@Input() tasksCollection: AngularFirestoreCollection

	constructor(
		private taskService: TaskService,
		public functions: FunctionsService
	) { }

	ngOnInit() {}

	taskChanged(event, task: Task){
		this.tasksCollection.doc(task.id).update({checked: event.detail.checked})
	}

	editTask(task: Task){
		this.taskService.taskData.next(task)
		this.taskService.isTaskOpen.next(true)
	}

	deleteTask(task: Task){
		this.tasksCollection.doc(task.id).delete()
	}

}
