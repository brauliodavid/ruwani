import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { IonItemSliding } from '@ionic/angular';
import { UserService } from 'src/app/services/user.service';
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
		public functions: FunctionsService,
		private userService: UserService
	) { }

	ngOnInit() {}

	taskChanged(event, task: Task){
		this.tasksCollection.doc(task.id).update({checked: event.detail.checked})
	}

	editTask(task: Task, taskSliding: IonItemSliding){
		this.taskService.taskData.next(task)
		this.taskService.isTaskOpen.next(true)
		taskSliding.close()
	}

	deleteTask(task: Task, taskSliding: IonItemSliding){
		this.tasksCollection.doc(task.id).delete()
		if(task.list.id){
			this.userService.userDoc.collection(task.list.type).doc(task.list.id).collection('tasks').doc(task.id).delete()
		}
		taskSliding.close()
	}

}
