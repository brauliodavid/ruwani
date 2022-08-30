import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { FirestoreService } from '../services/firestore.service';
import { FunctionsService } from '../services/functions.service';
import { UserService } from '../services/user.service';
import { getAuth, updatePassword } from "firebase/auth";
import { cloneDeep } from 'lodash'
import { ComponentsService } from '../services/components.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss']
})
export class AccountPage implements OnInit, OnDestroy {

	userForm: FormGroup

	passwordControl = new FormControl()

	unsubscribe = new Subject<void>()

	loaded: boolean = false

  	constructor(
		public functions: FunctionsService,
		private userService: UserService,
		private firestoreService: FirestoreService,
		private componentsService: ComponentsService,
		public auth: AngularFireAuth
	) {}

	ngOnInit(): void {
		this.userForm = new FormGroup({})

		this.firestoreService.getDoc({path: this.userService.userDoc}).pipe(
			map(res => {
				const user = res.data()
				this.userService.user = user
				this.functions.setForm(this.userForm, user)
				this.loaded = true
			}),
			takeUntil(this.unsubscribe)
		).subscribe()
	}

	async saveAccount(){
		const user = cloneDeep(this.userForm.getRawValue())
		delete user['id']
		await this.userService.userDoc.update(user)
		this.componentsService.openToast('Account saved!')
	}

	async resetPassword(){
		const auth = getAuth()
		const user = auth.currentUser
		const newPassword = this.passwordControl.value
		await updatePassword(user, newPassword).then(() => {
			this.componentsService.openToast('Password changed!')
		}).catch((error) => {
			this.componentsService.openToast('Error changing password', {color: 'danger'})
		})
	}

	logout(){
		this.auth.signOut()
	}

	ngOnDestroy(): void {
		this.unsubscribe.next()
		this.unsubscribe.complete()
	}

}
