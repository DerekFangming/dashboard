import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { DashboardComponent } from './dashboard/dashboard.component'
import { AppRoutingModule } from './app-routing.module'
import { FormsModule } from '@angular/forms'
import { NotifierModule } from 'angular-notifier'

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NotifierModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
