import { Injectable } from '@angular/core'
import { ActionSheetController, LoadingController, ToastController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class ComponentsService {
    
    constructor(
        public toastController: ToastController,
        private actionSheetCtrl: ActionSheetController,
        private loadingCtrl: LoadingController
    ) {}

    openToast(message, opts: any = {duration: 2000, color: 'dark'}){
		const {duration = 2000, color = 'dark'} = opts
        const presentToast = async () => {
            const toast = await this.toastController.create({
                message,
                duration,
                color
            })
            toast.present()
        }
        presentToast()
    }

    openConfirmDialog = async () => {
        const actionSheet = await this.actionSheetCtrl.create({
			header: 'Are you sure?',
			buttons: [
				{
					text: 'Yes',
					role: 'confirm',
				},
				{
					text: 'No',
					role: 'cancel',
				},
			],
        })
    
        actionSheet.present();
    
        const { role, data } = await actionSheet.onDidDismiss()

        if(role === 'confirm'){
            return true
        }
        return false
    }

    async showLoading() {
		const loading = await this.loadingCtrl.create({
			message: 'Loading...',
			keyboardClose: false,
			spinner: 'circles',
		})
	
		loading.present()

		return loading
    }
}

