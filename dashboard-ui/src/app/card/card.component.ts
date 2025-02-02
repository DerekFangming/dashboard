import { CommonModule } from '@angular/common'
import { Component, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, CardComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent implements OnInit {

  @Input() type: string | undefined
  @Input() icon: string | undefined
  @Input() data: any
  @Input() phoneMode: boolean | undefined

  constructor() { }

  ngOnInit(): void {
  }

  getBackground() {
    if (this.type == 'server') {
      if (this.data == null) return 'bg-red'
      if (parseInt(this.data.cpu) > 50 || parseInt(this.data.mem) > 50 || 
        (this.data.networkIn.includes('Mb') && parseInt(this.data.networkIn) > 5) ||
        (this.data.networkOut.includes('Mb') && parseInt(this.data.networkOut) > 5)) return 'bg-yellow'
      return 'bg-green'
    } else if (this.type == 'stock') {
      if (this.data == null) return 'bg-green'
      if (this.data.dp <= -5) return 'bg-dark-red'
      if (this.data.dp < 0) return 'bg-red'
      if (this.data.dp < 5) return 'bg-green'
      return 'bg-dark-green'
    } else if (this.type == 'garage') {
      if (this.data == null) return 'bg-green'
      if (this.data == 'closed') return 'bg-green'
      if (this.data == 'open') return 'bg-yellow'
      return 'bg-red'
    } else if (this.type == 'door') {
      if (this.data == null) return 'bg-green'
      if (this.data == 'locked') return 'bg-green'
      if (this.data == 'unlocked') return 'bg-yellow'
      if (this.data == 'jammed') return 'bg-red'
      return 'bg-red'
    }
    return 'bg-green'
  }

  parseLocalDate(date: any) {
    let d = new Date(date)
    return `${this.leadingZeros(d.getMonth() + 1)}/${this.leadingZeros(d.getDate())} - ${this.leadingZeros(d.getHours())}:${this.leadingZeros(d.getMinutes())}:${this.leadingZeros(d.getSeconds())}`
  }

  leadingZeros(i: any) {
    if (i < 10) return `0${i}`
    return `${i}`
  }

}
