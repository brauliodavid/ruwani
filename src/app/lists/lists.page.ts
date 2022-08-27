import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IonModal } from '@ionic/angular';
import { BehaviorSubject, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { List, LIST_MOCK } from '../interfaces/List';
import { Task } from '../interfaces/Task';
import { ComponentsService } from '../services/components.service';
import { FirestoreService } from '../services/firestore.service';
import { TaskService } from '../services/task.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-lists',
  templateUrl: 'lists.page.html',
  styleUrls: ['lists.page.scss']
})
export class ListsPage implements OnInit, OnDestroy {

	@ViewChild(IonModal) modal: IonModal

	addListForm = new FormGroup({
		name: new FormControl(null, [Validators.required])
	})

	listsCollection: AngularFirestoreCollection
	lists: List[] = []

	isTasksOpen = false

	currentList = new BehaviorSubject<List>(null)
	tasksCollection: AngularFirestoreCollection
	tasks: Task[] = []

	private unsubscribe = new Subject<void>()

  	constructor(
		private firestoreService: FirestoreService,
		public userService: UserService,
		private componentsService: ComponentsService,
		private taskService: TaskService
	) {}

	ngOnInit(): void {
		this.firestoreService.getCollection({collection: 'lists', parent: this.userService.userDoc}).pipe(
			map(res => {
				this.listsCollection = res.collection()
				this.lists = res.data()
			}),
			takeUntil(this.unsubscribe)
		).subscribe()

		this.currentList.pipe(
			switchMap(list => {
				if(list){
					return this.firestoreService.getCollection({collection: 'tasks', parent: this.listsCollection.doc(list.id)})
				}
				return Promise.resolve(null)
			}),
			map(res => {
				if(res){
					this.tasksCollection = res.collection()
					this.tasks = res.data()
				}
			}),
			takeUntil(this.unsubscribe)
		).subscribe()
	}

	async addList(){
		if(!this.addListForm.valid) return;

		const list: List = JSON.parse(JSON.stringify(LIST_MOCK))
		list.dateCreated = new Date()
		list.createdBy = this.userService.userMock
		list.name = this.addListForm.value.name
		await this.listsCollection.add(list)
		this.close()
		this.addListForm.get('name').setValue(null)
		this.componentsService.openToast('List created!')
	}

	close() {
		this.modal.dismiss(null, 'close')
	}

	deleteList(list: List){
		this.componentsService.openConfirmDialog().then(res => {
			if(res){
				this.listsCollection.doc(list.id).delete()
			}
		})
	}

	setOpen(isOpen: boolean, list: List) {
		this.isTasksOpen = isOpen
		this.currentList.next(list)
	}

	addTask(){
		this.taskService.isTaskOpen.next(true)
	}

	ngOnDestroy(): void {
		this.unsubscribe.next()
		this.unsubscribe.complete()
	}

}
