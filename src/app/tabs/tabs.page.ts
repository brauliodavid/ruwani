import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { FirestoreService } from '../services/firestore.service';
import { User } from '../interfaces/User';
import { UserService } from '../services/user.service';
import { TaskService } from '../services/task.service';
import { ComponentsService } from '../services/components.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit, OnDestroy {
	authenticated: Observable<boolean>

	activeTab: string = 'home'

	private unsubscribe = new Subject<void>()

  	constructor(
		public auth: AngularFireAuth,
		private router: Router,
		private route: ActivatedRoute,
		private firestoreService: FirestoreService,
		public userService: UserService,
		public taskService: TaskService,
		private componentsService: ComponentsService
	) {}

	ngOnInit(): void {
		const parts = window.location.href.split('/')
		const lastSegment = parts.pop() || parts.pop()  // handle potential trailing slash
		this.activeTab = lastSegment

		this.authenticated = this.auth.authState.pipe(
			switchMap(async auth => {
				const loading = await this.componentsService.showLoading()
				if (auth != null) {
					const userDoc = this.firestoreService.firestore().collection('users').doc(auth.uid)
					const userRef = await userDoc.ref.get()
					const user = {...userRef.data() as any, id: userRef.id} as User
					this.userService.userDoc = userDoc
					this.userService.user = user
					this.userService.userMock = {
						uid: user.id,
						name: user.name,
						email: user.email
					}
					await loading.dismiss()
					// this.router.navigate(['/tabs/home'])
					console.log('authenticated!')
					return true
				}
				await loading.dismiss()
				this.router.navigate(['/login'])
				return false
			}),
		)
	}

	setOpen(isOpen: boolean) {
		this.taskService.isTaskOpen.next(isOpen)
		this.taskService.taskData.next(null)
	}

	ngOnDestroy(): void {
		this.unsubscribe.next()
		this.unsubscribe.complete()
	}

}
