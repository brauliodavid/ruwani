import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { Form, FormArray, FormGroup } from '@angular/forms';
import { IonModal, PickerController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { Task, TASK_MOCK } from '../../interfaces/Task';
import { FunctionsService } from '../../services/functions.service';
import { UserService } from '../../services/user.service';
import { Moment } from 'moment';
import * as _moment from 'moment-timezone';
import { FirestoreService } from '../../services/firestore.service';
import { ComponentsService } from '../../services/components.service';
import { TaskService } from '../../services/task.service';
import { take, map, tap, takeUntil, switchMap } from 'rxjs/operators';
import { cloneDeep } from 'lodash'
import { Subject } from 'rxjs';
import { Microphone, AudioRecording } from '@mozartec/capacitor-microphone';
import { AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { List } from 'src/app/interfaces/List';
import { Camera, CameraResultType } from '@capacitor/camera';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NgCanvasPainterComponent } from 'ng-canvas-painter';
const moment = _moment

@Component({
  selector: 'add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss'],
})
export class AddTaskComponent implements OnInit, OnDestroy, AfterViewInit {
	@Output() closed = new EventEmitter()
	@ViewChild(IonModal) modal: IonModal
	@ViewChild('paintSection', {read: ViewContainerRef}) painterSectionRef: ViewContainerRef;
	@ViewChild(NgCanvasPainterComponent) painter: NgCanvasPainterComponent

	addTaskForm: FormGroup

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

	listsCollection: AngularFirestoreCollection
	lists: List[] = []

	plansCollection: AngularFirestoreCollection
	plans: List[] = []

	prevTask: Task

	activeImageUrl: string
	openImgModal: boolean = false

	emptyPaint: boolean = true
	loadedPaintSection: boolean = false

	private unsubscribe = new Subject<void>()

	constructor(
		public functions: FunctionsService,
		public userService: UserService,
		private firestoreService: FirestoreService,
		public componentsService: ComponentsService,
		public taskService: TaskService,
		private pickerCtrl: PickerController,
		private storage: AngularFireStorage
	) { }

	ngOnInit() {
		this.taskService.taskData.pipe(
			tap(() => this.loaded = false),
			switchMap(taskData => {
				let data: Task
				if(taskData){
					data = taskData
					this.prevTask = cloneDeep(taskData)
					this.date = data.date ? this.functions.dateFormat(data.date, 'YYYY-MM-DD') : null
					this.time = data.date && data.hasTime ? this.functions.dateFormat(data.date, 'YYYY-MM-DDTHH:mm') : null
					data.list.id ? this.taskService.taskList.next(data.list) : ''
				}else{
					data = JSON.parse(JSON.stringify(TASK_MOCK))
				}
				this.addTaskForm = new FormGroup({})
				this.functions.setForm(this.addTaskForm, data)

				return this.taskService.taskList
			}),
			map((list: List) => {
				if(list){
					this.functions.setForm(this.addTaskForm.get('list'), {id: list.id, name: list.name, type: list.type})
					if(list.type === 'plans'){
						this.date = this.functions.dateFormat(list.deadline, 'YYYY-MM-DD')
					}
				}else{
					this.functions.setForm(this.addTaskForm.get('list'), {id: null, name: null, type: null})
				}
			}),
			tap(() => this.loaded = true),
			takeUntil(this.unsubscribe)
		).subscribe()

		this.firestoreService.getCollection({collection: 'lists', parent: this.userService.userDoc}).pipe(
			switchMap(res => {
				this.listsCollection = res.collection()
				this.lists = res.data()
				return this.firestoreService.getCollection({collection: 'plans', parent: this.userService.userDoc})
			}),map(res => {
				this.plansCollection = res.collection()
				this.plans = res.data()
			}),
			takeUntil(this.unsubscribe)
		).subscribe()
	}

	ngAfterViewInit(): void {
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
		
		this.date = null
		this.time = null
		this.prevTask = null
		this.addTaskForm = null
		this.loadedPaintSection = false
		this.emptyPaint = true
		this.taskService.taskData.next(null)
		this.taskService.taskList.next(null)
	}

	async saveTask(){
		const task = this.addTaskForm.value as Task

		// set date
		const date = this.date ? moment(this.date) : moment()
		if(moment.isMoment(date) && this.time){
			const hours = parseInt(moment(this.time).format('HH'))
			const minutes = parseInt(moment(this.time).format('mm'))
			date.set('hour', hours).set('minute', minutes)
		}
		task.date = date ? date.toDate() : null
		const dateId = date ? date.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
		task.hasTime = this.time ? true : false

		const taskData: Task = cloneDeep(task)

		if(taskData.id){
			const taskId = taskData.id
			delete taskData['id']

			let taskDoc, taskDocList, hasList

			taskDocList = taskData.list.id ? this.userService.userDoc.collection(taskData.list.type).doc(taskData.list.id).collection('tasks').doc(taskId) : null as any

			// set list
			const setList = () => {
				if(taskData.list.id && this.prevTask.list.id === taskData.list.id){
					hasList = true
					taskDocList.update(taskData)
				}else if(this.prevTask.list.id !== taskData.list.id){
					hasList = true
					if(this.prevTask.list.id){
						this.userService.userDoc.collection(taskData.list.type).doc(this.prevTask.list.id).collection('tasks').doc(taskId).delete()
					}
					taskData.list.id ? taskDocList.set(taskData) : ''
				}
			}

			taskDoc = this.userService.userDoc.collection('tasks').doc(dateId).collection('data').doc(taskId)

			if(task.dateId !== dateId){
				taskData.dateId = dateId
				this.userService.userDoc.collection('tasks').doc(task.dateId).collection('data').doc(taskId).delete()
				await taskDoc.set(taskData)
			}else{
				await taskDoc.update(taskData)
			}

			// set list
			setList()

			// upload attachments
			Promise.all(taskData.attachments.map(a => {
				if(a.path) return a
				return this.uploadFile(a.downloadURL)
			})).then(attachments => {
				taskDoc.update({attachments})
				if(hasList){
					taskData.list.id ? taskDocList.update({attachments}) : ''
				}
			})

			//remove attachments
			// attachments.map(a => this.firestoreService.deleteImage(a.downloadURL))
		}else{
			taskData.dateCreated = new Date()
			taskData.createdBy = this.userService.userMock
			taskData.dateId = dateId
			const taskRef = await this.userService.userDoc.collection('tasks').doc(taskData.dateId).collection('data').add(taskData)
			const taskDoc = this.userService.userDoc.collection('tasks').doc(taskData.dateId).collection('data').doc(taskRef.id)

			// set list
			if(taskData.list.id){
				this.userService.userDoc.collection(taskData.list.type).doc(taskData.list.id).collection('tasks').doc(taskRef.id).set(taskData)
			}

			// upload attachments
			Promise.all(taskData.attachments.map(a => {
				if(a.path) return a
				return this.uploadFile(a.downloadURL)
			})).then(attachments => {
				taskDoc.update({attachments})
				if(taskData.list.id){
					this.userService.userDoc.collection(taskData.list.type).doc(taskData.list.id).collection('tasks').doc(taskRef.id).update({attachments})
				}
			})
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
		// if(!this.date){
		// 	this.date = moment().toISOString()
		// }
	}

	setInputType(type){
		this.inputType = type
		if(type === 'draw'){
			setTimeout(() => {
				this.loadedPaintSection = true
			}, 300)
		}
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
				return this.requestPermissions()
			}
		  	const startRecordingResult = await Microphone.startRecording();
			this.activeRecording = true
		} catch (error) {
		  	this.componentsService.openToast('Error recording audio', {color: 'danger'})
		}
	}
	
	async stopRecording() {
		try {
			this.recording = await Microphone.stopRecording();
			this.activeRecording = false
			this.processing = true

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
			this.processing = false
			this.transcription = transcription
		} catch (error) {
			this.componentsService.openToast('Error recording audio', {color: 'danger'})
		}
	}

	setTranscription(){
		this.addTaskForm.get('title').setValue(this.transcription as never)
		this.setInputType('form')
		this.transcription = null
	}

	async openListsPicker() {
		const picker = await this.pickerCtrl.create({
			columns: [
				{
					name: 'lists',
					options: [
						{text: 'none', value: null}, 
						...this.lists.map(list => ({text: list.name, value: list})),
						...this.plans.map(list => ({text: list.name, value: list}))
					]
				},
			],
			buttons: [
				{
					text: 'Cancel',
					role: 'cancel',
				},
				{
					text: 'Confirm',
					handler: (value) => {
						const list = value.lists.value
						console.log(list)
						this.taskService.taskList.next(list)
					},
				},
			],
		})
	
		await picker.present()
	}

	async addAttachments(){
		const result = await Camera.pickImages({
			quality: 90,
		})

		const localFiles = await Promise.all(result.photos.map(async image => ({downloadURL: image.webPath})))
		const attachments = this.addTaskForm.getRawValue().attachments
		this.functions.setForm(this.addTaskForm.get('attachments'), [...attachments, ...localFiles])
	}

	async takePhoto(){
		const image = await Camera.getPhoto({
			quality: 90,
			allowEditing: true,
			resultType: CameraResultType.Uri
		})
		  
		const attachments = this.addTaskForm.getRawValue().attachments
		const photo = {downloadURL: image.webPath}
		this.functions.setForm(this.addTaskForm.get('attachments'), [...attachments, photo])
	}

	async uploadFile(url){
		const name = `${Date.now()}`
		// const blob = this.b64toBlob(dataUrl)
		const blob = await (await fetch(url)).blob()
		// const theFile = new File([blob], name, { type: blob.type })
		// const data = await this.convertBlobToBase64(blob)
		// console.log(data)
		const path = `${this.userService.user.id}/${name}`
		const ref = this.storage.ref(path)
		await this.storage.upload(path, blob)
		return {
			downloadURL: await ref.getDownloadURL().toPromise(), 
			filename: name,
			path: path, 
		}
	}

	// Helper function
	convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
		const reader = new FileReader
		reader.onerror = reject
		reader.onload = () => {
			resolve(reader.result)
		}
		reader.readAsDataURL(blob)
	})

	b64toBlob = (dataURI) => {
		const parts = dataURI.split(',')
		const byteString = atob(parts[1])
		const ab = new ArrayBuffer(byteString.length)
		const ia = new Uint8Array(ab)
	
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i)
		}
		return new Blob([ab], { type: parts[0].split(';')[0].split(':')[1] })
	}

	urlContentToDataUri(url){
		return  fetch(url)
				.then(response => response.blob())
				.then(blob => new Promise(callback => {
					let reader = new FileReader()
					reader.onload = function(){callback(this.result)} 
					reader.readAsDataURL(blob)
				})) 
	}

	removeAttachment(image, index){
		(<FormArray>this.addTaskForm.get('attachments')).removeAt(index)
	}

	openImage(imageUrl){
		this.activeImageUrl = imageUrl
		this.openImgModal = true
	}

	onPaintStart(){
	}

	onPaintEnd(){
	}

	clearPaint(){
		this.loadedPaintSection = false
		setTimeout(() => {
			this.loadedPaintSection = true
			this.emptyPaint = true
		}, 1)
	}

	selectPaint(){
		this.painter
		const dataURL = this.painter.canvas.nativeElement.toDataURL()
		const paint = {downloadURL: URL.createObjectURL(this.b64toBlob(dataURL))}
		const attachments = this.addTaskForm.getRawValue().attachments
		this.functions.setForm(this.addTaskForm.get('attachments'), [...attachments, paint])
		this.setInputType('form')
		this.loadedPaintSection = false
		this.emptyPaint = true
	}

	onIsEmptyChanged(event){
		this.emptyPaint = event
	}

	ngOnDestroy(): void {
		this.unsubscribe.next()
		this.unsubscribe.complete()
	}

}
