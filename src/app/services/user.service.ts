import { Injectable } from "@angular/core";
import { AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { User } from "../interfaces/User";

@Injectable({
    providedIn: 'root',
})
export class UserService {
    userDoc: AngularFirestoreDocument
    user: User
    userMock: any
}