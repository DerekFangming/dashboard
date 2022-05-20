import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  gameIdInput = ''
  error = ''
  ws: WebSocket
  players = []
  heartbeatInterval

  env = environment

  @ViewChild('errModal', { static: true}) errModal: TemplateRef<any>

  constructor(private elementRef:ElementRef) { }

  ngOnInit() {
    this.connect()
  }

  connect() {
  }

  

}
