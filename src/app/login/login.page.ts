import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

	private loginForm: FormGroup

	constructor(
		public auth: AngularFireAuth,
		private router: Router
	) { }

	ngOnInit() {
		this.authenticate()

		this.loginForm = new FormGroup({
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

}
