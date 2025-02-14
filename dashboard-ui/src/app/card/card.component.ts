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

  networkWarnLimit = 5 * 1024 * 1024

  constructor() { }

  ngOnInit(): void {
  }

  getBackground() {
    if (this.type == 'server') {
      if (this.data == null) return 'bg-red'
      if (this.data.cpu > 50 || this.data.mem > 50 || this.data.upload > this.networkWarnLimit || this.data.download > this.networkWarnLimit) return 'bg-yellow'
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


  byteToReadableSpeed(b: number) {
    if (b < 1000) {
      return `${b.toFixed(2)} b/s`
    }
  
    b = b / 1024
    if (b < 1000) {
      return `${b.toFixed(2)} Kb/s`
    }
  
    b = b / 1024
    return `${b.toFixed(2)} Mb/s`
  }
    

}
