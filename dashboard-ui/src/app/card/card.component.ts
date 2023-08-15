import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {

  @Input() type: string
  @Input() icon: string
  @Input() data: any

  constructor() { }

  ngOnInit(): void {
  }

  getBackground() {
    if (this.type == 'server') {
      return this.data ? 'bg-green' : 'bg-red'
    } else if (this.type == 'stock') {
      if (this.data == null) return 'bg-green'
      if (this.data.dp <= -5) return 'bg-dark-red'
      if (this.data.dp < 0) return 'bg-red'
      if (this.data.dp < 5) return 'bg-green'
      return 'bg-dark-green'
    } else if (this.type == 'garage') {
      if (this.data == null) return 'bg-green'
      if (this.data.state == 'closed') return 'bg-green'
      if (this.data.state == 'closing' || this.data.state == 'opening') return 'bg-yellow'
      return 'bg-red'
    } else if (this.type == 'alexa') {
      if (this.data == null) return 'bg-green'
      if (this.data.door == 'locked') return 'bg-green'
      if (this.data.door == 'unlocked') return 'bg-yellow'
      return 'bg-red'
    }
    return 'bg-green'
  }

}
