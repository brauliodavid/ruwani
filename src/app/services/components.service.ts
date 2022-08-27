import { Injectable } from '@angular/core'
import { ActionSheetController, ToastController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class ComponentsService {
    
    constructor(
        public toastController: ToastController,
        private actionSheetCtrl: ActionSheetController
    ) {}

    openToast(message, duration = 2000){
        const presentToast = async () => {
            const toast = await this.toastController.create({
                message,
                duration,
                color: 'dark'
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
}

