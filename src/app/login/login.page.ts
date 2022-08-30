import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ComponentsService } from '../services/components.service';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

	private loginForm: FormGroup
	private signupForm: FormGroup

	isModalOpen: boolean = false

	constructor(
		public auth: AngularFireAuth,
		private router: Router,
		private componentsService: ComponentsService,
		private firestoreService: FirestoreService
	) { }

	ngOnInit() {
		this.authenticate()

		this.loginForm = new FormGroup({
			email: new FormControl(null, [Validators.required, Validators.email]),
			password: new FormControl(null, [Validators.required])
		})

		this.signupForm = new FormGroup({
			name: new FormControl(null, [Validators.required]),
			email: new FormControl(null, [Validators.required, Validators.email]),
			password: new FormControl(null, [Validators.required])
		})
	}

	async authenticate(){
		const authenticated = await this.auth.authState.pipe(take(1)).toPromise()
		if(authenticated){
			this.router.navigate(['/'])
		}
	}

	login() {
		// this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
		this.auth.signInWithEmailAndPassword(this.loginForm.value.email, this.loginForm.value.password)
		.then(res => {
			this.router.navigate(['/tabs/home'])
			console.log('Successfully signed in!')
		})
		.catch(err => {
			console.log('Something is wrong:', err.message)
		})
	}

	logout() {
		this.auth.signOut()
	}

	onSubmit(){
		if(this.loginForm.valid){
			this.login()
		}
	}

	async signUp(){
		if(this.signupForm.valid){
			const {name, email, password} = this.signupForm.getRawValue()

			const loading = await this.componentsService.showLoading()

			const auth = getAuth()

			createUserWithEmailAndPassword(auth, email, password)
			.then((userCredential) => {
				// Signed in 
				const user = userCredential.user
				return this.auth.signInWithEmailAndPassword(email, password)
				.then(res => {
					this.setOpen(false)
					setTimeout(async () => {
						await this.firestoreService.firestore().collection('users').doc(user.uid).set({name, email, password})
						loading.dismiss()
						this.componentsService.openToast('Account created!')
						this.router.navigate(['/tabs/home'])
					}, 3000)
				})
			})
			.catch((error) => {
				const errorCode = error.code
				const errorMessage = error.message
				loading.dismiss()
				this.componentsService.openToast('Error creating account', {color: 'danger'})
			})
		}else{
			this.componentsService.openToast('Fill all the fields', {color: 'danger'})
		}
	}

	setOpen(open){
		this.isModalOpen = open
	}

}
