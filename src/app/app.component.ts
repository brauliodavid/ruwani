import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

	authenticated: Observable<boolean>

  	constructor(
		public auth: AngularFireAuth
	) {}

	ngOnInit(): void {
		this.authenticated = this.auth.authState.pipe(
			map(auth => {
				if (auth != null) {
					return true
				}
				return false
			})
		)
	}
}
