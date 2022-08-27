import { AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChildren, ViewContainerRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { Moment } from 'moment';
import * as _moment from 'moment-timezone';
import { FunctionsService } from '../services/functions.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { switchMap, map, takeUntil } from 'rxjs/operators';
import { FirestoreService } from '../services/firestore.service';
import { AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Task } from '../interfaces/Task';
import { TaskService } from '../services/task.service';
import { IonItemSliding } from '@ionic/angular';
const moment = _moment

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy, AfterViewInit {

	dates = []
	activeDate = new BehaviorSubject<Moment>(moment())

	tasksCollection: AngularFirestoreCollection
	tasks: Task[] = []

	@ViewChildren(IonItemSliding, {read: ViewContainerRef}) tasksItemsRef: QueryList<ViewContainerRef>

	private unsubscribe = new Subject<void>()

  	constructor(
		public userService: UserService,
		public functions: FunctionsService,
		private firestoreService: FirestoreService,
		public taskService: TaskService
	) {}

	ngOnInit(): void {
		this.loadDates()
		this.loadTasks()
	}

	ngAfterViewInit(): void {
		this.tasksItemsRef.changes.subscribe(() => {
			this.tasksItemsRef.toArray().map(item => {
				// const root = item.element.nativeElement.querySelector('ion-item').querySelector('ion-checkbox').shadowRoot.querySelector('.checkbox-icon')
				// console.log(root)
			})
		})
	}

	loadDates(){
		this.dates = new Array(7).fill(0).map((d, i) => {
			const date = moment().subtract(i, 'days')
			const active = date.format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
			if(active){
				this.activeDate.next(date)
			}
			return {
				date,
				active
			}
		})
	}

	loadTasks(){
		this.activeDate.pipe(
			switchMap(date => {
				const parentDoc = this.userService.userDoc.collection('tasks').doc(date.format('YYYY-MM-DD'))
				return this.firestoreService.getCollection({collection: 'data', parent: parentDoc, orderBy: 'date', order: 'asc'})
			}),
			map(res => {
				this.tasksCollection = res.collection()
				this.tasks = res.data()
			}),
			takeUntil(this.unsubscribe)
		).subscribe()		
	}

	setActiveDate(date){
		this.dates.map(d => d.active = false)
		date.active = true
		this.activeDate.next(date.date)
	}

	ngOnDestroy(): void {
		this.unsubscribe.next()
		this.unsubscribe.complete()
	}

}
