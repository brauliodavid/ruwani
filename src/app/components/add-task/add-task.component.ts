import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { Task, TASK_MOCK } from '../../interfaces/Task';
import { FunctionsService } from '../../services/functions.service';
import { UserService } from '../../services/user.service';
import { Moment } from 'moment';
import * as _moment from 'moment-timezone';
import { FirestoreService } from '../../services/firestore.service';
import { ComponentsService } from '../../services/components.service';
import { TaskService } from '../../services/task.service';
import { take, map, tap, takeUntil } from 'rxjs/operators';
import { cloneDeep } from 'lodash'
import { Subject } from 'rxjs';
import { Microphone, AudioRecording } from '@mozartec/capacitor-microphone';
const moment = _moment

@Component({
  selector: 'add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss'],
})
export class AddTaskComponent implements OnInit, OnDestroy {
	@Output() closed = new EventEmitter()
	@ViewChild(IonModal) modal: IonModal

	addTaskForm = new FormGroup({})

	date: string = null
	time: string = null

	isDateOpen: boolean = false
	isTimeOpen: boolean = false

	inputType: string = 'form'

	loaded: boolean = false

	recording: AudioRecording
	activeRecording: boolean = false
	processing: boolean = false
	transcription: string

	private unsubscribe = new Subject<void>()

	constructor(
		public functions: FunctionsService,
		public userService: UserService,
		private firestoreService: FirestoreService,
		public componentsService: ComponentsService,
		public taskService: TaskService
	) { }

	ngOnInit() {
		this.taskService.taskData.pipe(
			map(taskData => {
				let data: Task
				if(taskData){
					data = taskData
					this.date = data.date ? this.functions.dateFormat(data.date, 'YYYY-MM-DD') : null
					this.time = data.date ? this.functions.dateFormat(data.date, 'YYYY-MM-DDTHH:mm') : null
				}else{
					data = JSON.parse(JSON.stringify(TASK_MOCK))
				}
				
				this.functions.setForm(this.addTaskForm, data)
			}),
			tap(() => this.loaded = true),
			takeUntil(this.unsubscribe)
		).subscribe()
	}

	cancel() {
		this.modal.dismiss(null, 'cancel')
		this.close()
	}

	confirm() {
		this.modal.dismiss({}, 'confirm')
		this.close()
	}

	onWillDismiss(event: Event) {
		const ev = event as CustomEvent<OverlayEventDetail<string>>
		if (ev.detail.role === 'confirm') {
			// this.message = `Hello, ${ev.detail.data}!`
		}
	}

	async saveTask(){
		const task = this.addTaskForm.value as Task

		// set date
		const date = this.date ? moment(this.date) : null
		if(moment.isMoment(date) && this.time){
			const hours = parseInt(moment(this.time).format('HH'))
			const minutes = parseInt(moment(this.time).format('mm'))
			date.set('hour', hours).set('minute', minutes)
		}
		task.date = date ? date.toDate() : null
		const dateId = date ? date.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
		task.hasTime = this.time ? true : false

		if(task.id){
			const taskData = cloneDeep(task)
			delete taskData['id']
			if(task.dateId !== dateId){
				taskData.dateId = dateId
				this.userService.userDoc.collection('tasks').doc(task.dateId).collection('data').doc(task.id).delete()
				await this.userService.userDoc.collection('tasks').doc(taskData.dateId).collection('data').add(taskData)
			}else{
				await this.userService.userDoc.collection('tasks').doc(task.dateId).collection('data').doc(task.id).update(taskData)
			}
		}else{
			task.dateCreated = new Date()
			task.createdBy = this.userService.userMock
			task.dateId = dateId
			await this.userService.userDoc.collection('tasks').doc(task.dateId).collection('data').add(task)
		}
		
		this.close()
		this.componentsService.openToast('Task saved!')
	}

	close(){
		this.taskService.isTaskOpen.next(false)
		this.taskService.taskData.next(null)
		this.closed.emit()
	}

	getSelectedDate(){
		if(this.date){
			return moment(this.date).format('MMM DD')
		}
		return 'date'
	}

	getSelectedTime(){
		if(this.time){
			return moment(this.time).format('h:mm A')
		}
		return 'time'
	}

	setDateOpen(open){
		this.isDateOpen = open
	}

	setTimeOpen(open){
		this.isTimeOpen = open
	}

	timeChanged(event){
		if(!this.date){
			this.date = moment().toISOString()
		}
	}

	setInputType(type){
		this.inputType = type
	}

	async checkPermissions() {
		try {
		  	const checkPermissionsResult = await Microphone.checkPermissions();
		  	console.log('checkPermissionsResult: ' + JSON.stringify(checkPermissionsResult));
			return checkPermissionsResult
		} catch (error) {
		  	console.error('checkPermissions Error: ' + JSON.stringify(error));
		}
	}
	
	async requestPermissions() {
		try {
		  	const requestPermissionsResult = await Microphone.requestPermissions();
		  	console.log('requestPermissionsResult: ' + JSON.stringify(requestPermissionsResult));
		} catch (error) {
		  	console.error('requestPermissions Error: ' + JSON.stringify(error));
		}
	}
	
	async startRecording() {
		try {
			if(this.activeRecording){
				return this.stopRecording()
			}
			const permissions = await this.checkPermissions()
			if(permissions.microphone !== 'granted'){
				// this.print = permissions.microphone
				return this.requestPermissions()
			}
		  	const startRecordingResult = await Microphone.startRecording();
			this.activeRecording = true
		  	console.log('startRecordingResult: ' + JSON.stringify(startRecordingResult));
		} catch (error) {
		  	console.error('startRecordingResult Error: ' + JSON.stringify(error));
		}
	}
	
	async stopRecording() {
		try {
			this.recording = await Microphone.stopRecording();
			this.activeRecording = false
			this.processing = true
			console.log('recording: ' + JSON.stringify(this.recording));
			console.log('recording.dataUrl: ' + JSON.stringify(this.recording.dataUrl));
			console.log('recording.duration: ' + JSON.stringify(this.recording.duration));
			console.log('recording.format: ' + JSON.stringify(this.recording.format));
			console.log('recording.mimeType: ' + JSON.stringify(this.recording.mimeType));
			console.log('recording.path: ' + JSON.stringify(this.recording.path));
			console.log('recording.webPath: ' + JSON.stringify(this.recording.webPath));
			// this.webPaths.push(this.recording.webPath);
			// this.dataUrls.push(this.recording.dataUrl);

			const data: any = {
				audio_data: this.recording.base64String,
			}
	
			const headers = {
				'Content-Type': 'application/json',
			}
	
			const opts = {
				method: 'POST',
				headers,
				body: JSON.stringify(data),
			} as any
	
			const response = await fetch(`http://localhost:7500/speechToText`, opts)
			const {transcription}: any = await response.json()
			console.log(transcription)
			this.processing = false
			this.transcription = transcription
		} catch (error) {
		  	console.error('recordingResult Error: ' + JSON.stringify(error))
		}
	}

	ngOnDestroy(): void {
		this.unsubscribe.next()
		this.unsubscribe.complete()
	}

}
