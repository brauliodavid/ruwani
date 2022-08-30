import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AddTaskComponent } from './add-task/add-task.component';
import { TasksComponent } from './tasks/tasks.component';
import { NgCanvasPainterModule } from 'ng-canvas-painter';

@NgModule({
  declarations: [
    AddTaskComponent, 
    TasksComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgCanvasPainterModule
  ],
  exports: [
    AddTaskComponent, 
    TasksComponent
  ],
  providers: [],
  bootstrap: [],
})
export class ComponentsModule {}
