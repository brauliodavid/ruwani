import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListsPage } from './lists.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { ListPageRoutingModule } from './lists-routing.module';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExploreContainerComponentModule,
    RouterModule.forChild([{ path: '', component: ListsPage }]),
    ListPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ListsPage]
})
export class ListsPageModule {}
