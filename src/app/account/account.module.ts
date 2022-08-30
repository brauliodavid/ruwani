import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccountPage } from './account.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { AccountPageRoutingModule } from './account-routing.module';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExploreContainerComponentModule,
    AccountPageRoutingModule,
    ComponentsModule
  ],
  declarations: [AccountPage]
})
export class AccountPageModule {}
