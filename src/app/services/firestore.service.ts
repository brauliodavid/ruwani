import { Injectable } from '@angular/core';
import { Action, AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentData, DocumentSnapshot } from '@angular/fire/compat/firestore'
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, BehaviorSubject, of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {

	constructor(
		private afs: AngularFirestore,
		//private db: AngularFireDatabase,
		private storage: AngularFireStorage,
	){
	}

	/**
     * Returns the Firestore database instance
     * @function
	 * @returns {AngularFirestore}
     */
	firestore(): AngularFirestore {
		return this.afs
	}
	
	/**
     * Returns the Firebase object instance
     * @function
	 * @returns {AngularFireObject<T>}
     */
	// object(path): AngularFireObject<any> {
	// 	return this.db.object(path)
	// }

	/**
     * Returns a Firestore collection reference
     * @function
	 * @returns {AngularFirestoreCollection}
	 * @param {string} collection the collection name
	 * @param {AngularFirestoreDocument | string | DocumentPath[]} parent the parent document reference|string|path
     */
	collection(params: FirestoreCollectionParams): AngularFirestoreCollection {
		const {collection, parent} = params
		const ref = this.getDocRef(parent)
		return ref.collection(collection)
	}

	/**
     * Returns a Firebase collection reference as promise
     * @function
	 * @returns {Promise<firebase.firestore.QuerySnapshot>}
     */
	collectionRef(params: FirestoreCollectionParams): Promise<firebase.firestore.QuerySnapshot> {
		return this.collection(params).ref.get()
	}

	/**
     * Returns a Firestore document reference
     * @function
	 * @returns {AngularFirestoreDocument}
	 * @param {string} id the document id
	 * @param {AngularFirestoreCollection} collection the parent collection Firestore reference
	 * @param {string|DocumentPath[]} path the document reference as string|path, if exists, overrides the collection & id params
     */
	doc(params: FirestoreDocParams | string){
		if(typeof params === 'string'){
			return this.getDocRef(params)
		}
		const {id, collection, path} = params
		let ref: AngularFirestoreDocument
		if(path){
			ref = this.getDocRef(path)
			return ref
		}
		return collection.doc(id)
	}

	/**
     * Returns a Firebase document reference as promise
     * @function
	 * @returns {Promise<firebase.firestore.QueryDocumentSnapshot>}
     */
	docRef(params: FirestoreDocParams): Promise<firebase.firestore.QueryDocumentSnapshot>{
		return this.doc(params).ref.get()
	}

	/**
     * Returns a Firestore collection data observable
     * @function
	 * @returns {Observable<FirestoreCollection>}
	 * @param {string} collection the collection name
	 * @param {AngularFirestoreDocument | string | DocumentPath[]} parent the parent document reference|string|path
	 * @param {FirestoreQueryFilterOp[]} filters array of filters
	 * @param {number} limit of the query - default no limit
	 * @param {string} orderBy property name to orderby
	 * @param {string}order order 'asc' or 'desc'
	 * @param {any} paginators paginator args
     */
	getCollection(params: FirestoreCollectionParams): Observable<FirestoreCollection>{
		const {collection, parent, filters, limit, orderBy, order, paginator} = params
		const documents = of([]);

		const queryFilters = new BehaviorSubject<FirestoreQueryFilterOp[]>(null);

		if(filters && filters.length){
			queryFilters.next(filters)
		}

		const ref = this.getDocRef(parent)
		
		//Firestore 'documents' collections
        return documents.pipe(
            switchMap((docs) => {
				return queryFilters.pipe(
					switchMap((queryFilters) => {
						const collectionRef = ref.collection(collection, ref => {
							let query : firebase.firestore.Query = ref;
		
							if(queryFilters){
								queryFilters.map(filter => {
									if(filter.key) { query = query.where(filter.key, filter.operator, filter.value) };
								})
								return query
							}
		
							if(limit){
								query = query.limit(limit)
							}
		
							if(!paginator || paginator.page == 0){
								if(orderBy && order){
									query = query.orderBy(orderBy, order)
								}
								return query
							}
		
							if(paginator.lastVisible && paginator.page && paginator.page > paginator.previousPage){
								query = query.orderBy(orderBy, order).startAfter(paginator.lastVisible[orderBy])
							}
		
							if(paginator.firstVisible && paginator.page && paginator.page < paginator.previousPage){
								query = query.orderBy(orderBy, order === 'asc' ? 'desc' : 'asc').startAfter(paginator.firstVisible[orderBy])
							}
							
							return query
						})
		
						return collectionRef.valueChanges({idField: 'id'})
					}),
					map((actions: any) => {
						let data = actions
						if(paginator && paginator.firstVisible && paginator.page && paginator.page < paginator.previousPage){
							data = data.reverse()
						}
						return new FirestoreCollection(ref.collection(collection), data)
					})
				)
			}),
		)
	}

	/**
     * Returns a Firestore document reference observable
     * @function
	 * @returns {AngularFirestoreDocument}
	 * @param {string} id the document id
	 * @param {AngularFirestoreCollection} collection the parent collection Firestore reference
	 * @param {string|DocumentPath[]} path the document reference as string|path, if exists, overrides the collection & id params
     */
	getDoc(params: FirestoreDocParams | AngularFirestoreDocument | string): Observable<FirestoreDocument>{
		const ref: AngularFirestoreDocument = params instanceof AngularFirestoreDocument ? params : this.doc(params)
		return ref.snapshotChanges().pipe(
			map((actions: Action<DocumentSnapshot<firebase.firestore.DocumentData>>) => {
				if (actions.payload.exists === false) {
					return new FirestoreDocument(ref, null, actions)
				}
				const data = {...actions.payload.data(), id: actions.payload.id} as any
				return new FirestoreDocument(ref, data, actions)
			})
		)
	}

	/**
     * Returns a Firebase document reference Promise
     * @function
	 * @returns {Promise<firebase.firestore.DocumentReference>}
	 * @param {any} data the document data
	 * @param {string} collection collection name
	 * @param {AngularFirestoreDocument | string | DocumentPath[]} parent the parent document from the collection name - reference|string|path
     */
	addDocument(params): Promise<firebase.firestore.DocumentReference> {
		const {data, collection, parent} = params
		return this.getDocRef(parent).collection(collection).add(data)
	}

	/**
     * Returns a Promise
     * @function
	 * @returns {Promise<void>}
	 * @param {any} data the document data
	 * @param {string} collection collection name
	 * @param {string} docId the new document id to set
	 * @param {AngularFirestoreDocument | string | DocumentPath[]} parent the parent document from the collection name - reference|string|path
     */
	setDocument(params): Promise<void> {
		const {collection, docId, data, parent} = params
		return this.getDocRef(parent).collection(collection).doc(docId).set(data)
	}
	
	/**
     * Returns a Firestore document reference Promise
     * @function
	 * @returns {Promise<void>}
	 * @param {any} data the document data
	 * @param {AngularFirestoreDocument} docRef the document ref to update
     */
	updateDocument(docRef: AngularFirestoreDocument, data: any): Promise<void> {
		delete data['id'];
        return docRef.update(data)
	}

	/**
     * Returns a Promise
     * @function
	 * @returns {Promise<void>}
	 * @param {string} id the document id to delete
	 * @param {AngularFirestoreCollection} collection parent collection Firestore reference
	 * @param {string} children children collections separeted by ',' to delete foreach document
     */
	async deleteDoc(params){
		const {id, collection, children} = params
		let subCollections = []
		if(children){
			subCollections = children.split(',')
		}
		Promise.all(subCollections.map(async sub => {
			const subCollection = collection.doc(id).collection(sub)
			const subDocs = await subCollection.ref.get()

			await Promise.all(subDocs.docs.map(async doc => await this.deleteDoc({id: doc.id, collection: subCollection, children})))
		}))

		collection.doc(id).delete()
	}

	async deleteImage(downloadURL, path = null){
		const sizes = [150, 350, 1024];

		await this.storage.storage.refFromURL(downloadURL).delete(); //remove the file

		if(!path) return;

		const arr = path.split('/')
		const name = arr[arr.length-1]
		delete arr[arr.length-1]
		const newPath = arr.join('/')

		sizes.map(size => {
			const thumb = `thumb@${size}_${name}`
			const thumbPath = `${newPath}/${thumb}`
			this.storage.storage.ref(thumbPath).delete();
		})
	}

	private getDocRef(path): AngularFirestoreDocument{
		let ref: any = this.afs
		if(path instanceof AngularFirestoreDocument){
			ref = path
		}else if(!Array.isArray(path) && (typeof path === 'string')){
			const pathSplited = path.split('/').filter(v => v != '')
			path = pathSplited.map((val, i) => {
				if(i % 2){
					return {
						collection: pathSplited[i-1],
						id: val
					}
				}
				return false
			}).filter(v => v !== false)
		}

		if(Array.isArray(path)){
			path.map(p => {
				ref = ref.collection(p.collection).doc(p.id)
			})
		}

		return ref
	}

}

export class FirestoreCollection {

	constructor(
		private ref: AngularFirestoreCollection,
		private documents: any[] = [],
	){
	}

	collection(): AngularFirestoreCollection {
		return this.ref
	}

	data(): any[] {
		return this.documents
	}
}

export class FirestoreDocument {

	actions: Action<DocumentSnapshot<firebase.firestore.DocumentData>>

	constructor(
		private ref: AngularFirestoreDocument,
		private document: any = null,
		private _actions: Action<DocumentSnapshot<firebase.firestore.DocumentData>>
	){
		this.actions = _actions
	}

	doc(): AngularFirestoreDocument {
		return this.ref
	}

	data(): any {
		return this.document
	}
}

export interface FirestoreCollectionParams {
	collection: string
	parent?: AngularFirestoreDocument | string | DocumentPath[]
	filters?: FirestoreQueryFilterOp[]
	limit?: number
	paginator?: any
	orderBy?: string
	order?: any // asc | desc
}

export interface FirestoreDocParams {
	id?: string
	collection?: AngularFirestoreCollection
	path?: AngularFirestoreDocument | string | DocumentPath[]
}

export interface DocumentPath {
	collection: string
	id: string
}

export interface FirestoreQueryFilterOp {
	key: string
	value: string
	operator: any // '<', '<=', '==', '>=', '>', 'array-contains', 'in', and 'array-contains-any'
}