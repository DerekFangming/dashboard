import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { LobbyComponent } from './lobby/lobby.component'


const routes: Routes = [
  { path: 'game', component: LobbyComponent},
  { path: '**', redirectTo: '/game', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
