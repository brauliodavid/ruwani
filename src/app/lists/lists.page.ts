import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IonModal } from '@ionic/angular';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { List, LIST_MOCK } from '../interfaces/List';
import { Task } from '../interfaces/Task';
import { ComponentsService } from '../services/components.service';
import { FirestoreService } from '../services/firestore.service';
import { TaskService } from '../services/task.service';
import { UserService } from '../services/user.service';
import { OverlayEventDetail } from '@ionic/core/components';
import { ActivatedRoute } from '@angular/router';
import { FunctionsService } from '../services/functions.service';

@Component({
  selector: 'app-lists',
  templateUrl: 'lists.page.html',
  styleUrls: ['lists.page.scss']
})
export class ListsPage implements OnInit, OnDestroy {

	@ViewChild(IonModal) modal: IonModal

	type: string = 'lists'
	title: string = 'Lists'

	addListForm = new FormGroup({
		type: new FormControl('lists', [Validators.required]),
		name: new FormControl(null, [Validators.required]),
		deadline: new FormControl(null),
		labels: new FormControl([])
	})

	listsCollection: AngularFirestoreCollection
	lists: List[] = []

	isTasksOpen = false

	currentList = new BehaviorSubject<List>(null)
	tasksCollection: AngularFirestoreCollection
	tasks: Task[] = []

	listForm: FormGroup
	listSubscription

	isAddOpen: boolean = false
	isDateOpen: boolean = false
	isDateOpen2: boolean = false

	private unsubscribe = new Subject<void>()

  	constructor(
		private firestoreService: FirestoreService,
		public userService: UserService,
		private componentsService: ComponentsService,
		private taskService: TaskService,
		private route: ActivatedRoute,
		public functions: FunctionsService,
		private fb: FormBuilder
	) {}

	ngOnInit(): void {
		const parts = window.location.href.split('/')
		const lastSegment = parts.pop() || parts.pop()  // handle potential trailing slash
		this.type = lastSegment

		if(this.type === 'plans'){
			this.title = 'Plans'
			this.addListForm.get('type').setValue('plans')
			this.addListForm.get('deadline').setValidators([Validators.required])
		}

		this.firestoreService.getCollection({collection: this.type, parent: this.userService.userDoc}).pipe(
			map(res => {
				this.listsCollection = res.collection()
				const lists = res.data()
				this.lists = lists.map(list => ({
					...list, 
					completed: this.firestoreService.getCollection({collection: 'tasks', parent: this.listsCollection.doc(list.id)}).pipe(
						map(res => {
							const tasks: Task[] = res.data()
							const tasksDone = tasks.filter(t => t.checked)
							return {
								total: tasks.length,
								done: tasksDone.length,
								percentage: tasks.length ? this.functions.priceFormat(tasksDone.length*100/tasks.length) : 0,
								value: tasks.length ? tasksDone.length/tasks.length : 0
							}
						})
					)
				}))
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
		list.type = this.addListForm.value.type
		list.deadline = this.addListForm.value.deadline
		list.labels = this.addListForm.value.labels
		await this.listsCollection.add(list)
		this.close()
		this.addListForm.get('name').setValue(null)
		this.addListForm.get('deadline').setValue(null)
		this.addListForm.get('labels').setValue([])
		this.componentsService.openToast(`${this.title} created!`)
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

		if(list){
			this.currentList.next(list)

			this.listForm = this.fb.group({
				name: list.name,
				deadline: list.deadline,
				labels: [list.labels]
			})

			this.listSubscription = this.listForm.valueChanges.pipe(
				debounceTime(500)
			).subscribe(value => this.listsCollection.doc(list.id).update(value))
		}
	}

	onWillDismiss(event: Event) {
		this.listSubscription = null
	}

	async addTask(){
		const list = await this.currentList.pipe(take(1)).toPromise()
		this.taskService.isTaskOpen.next(true)
		this.taskService.taskList.next({id: list.id, name: list.name, type: list.type, deadline: list.deadline})
	}

	setDateOpen(open){
		this.isDateOpen = open
	}

	setDateOpen2(open){
		this.isDateOpen2 = open
	}

	onLabelInput(event, labelInput){
		if(event.key === 'Enter'){
			const labels = this.addListForm.value.labels
			this.addListForm.get('labels').setValue([...labels, labelInput.value])
			labelInput.value = ''
		}
	}

	onLabelInput2(event, labelInput){
		if(event.key === 'Enter'){
			const labels = this.listForm.get('labels').value
			this.listForm.get('labels').setValue([...labels, labelInput.value])
			labelInput.value = ''
		}
	}

	removeLabel(label){
		const labels = this.addListForm.value.labels.filter(l => l !== label)
		this.addListForm.get('labels').setValue(labels)
	}

	removeLabel2(label){
		const labels = this.listForm.value.labels.filter(l => l !== label)
		this.listForm.get('labels').setValue(labels)
	}

	ngOnDestroy(): void {
		this.unsubscribe.next()
		this.unsubscribe.complete()
	}

}
