import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Order } from 'src/app/models/order.model';
import { Stay } from 'src/app/models/stay.model';
import { OrderService } from 'src/app/services/order.service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'purchase-indication',
  templateUrl: './purchase-indication.component.html',
  styleUrls: ['./purchase-indication.component.scss']
})
export class PurchaseIndicationComponent implements OnInit {

  constructor(
    private orderService: OrderService,
    private router: Router,
    private snackBar: MatSnackBar,
    private utilService: UtilService
  ) { }

  @Input()  stay !: Stay
  @Output() setIsReserveClick = new EventEmitter()

  order!: Order
  isAfterConfirm: boolean = false
  isLoading:      boolean = false   // empêche les doubles clics

  async ngOnInit() {
    this.order = await this.orderService.getCurrOrder()
  }

  // ─── Getters ──────────────────────────────────────────────────────────────────

  get GetTotalDays(): number {
    return this.utilService.getDaysBetweenDates(
      this.order.endDate,
      this.order.startDate
    )
  }

  get Price(): number {
    return this.stay.price * this.GetTotalDays
  }

  get ServiceFee(): string {
    return (this.Price * 0.17).toFixed()
  }

  get getGuests(): string {
    let str = (this.order?.guests.adults + this.order.guests.children) > 0
      ? (this.order.guests.adults + this.order.guests.children) + ' guests '
      : ''
    str += this.order?.guests.infants > 0
      ? ', ' + this.order.guests.infants + ' infants '
      : ''
    str += this.order?.guests.pets > 0
      ? ', ' + this.order.guests.pets + ' pets '
      : ''
    return str
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  onClickBack() {
    this.setIsReserveClick.emit(false)
  }

  async onClickConfirm() {

    // Empêcher les doubles clics pendant le chargement
    if (this.isLoading) return
    this.isLoading      = true
    this.isAfterConfirm = true

    try {
      await this.orderService.save(this.order)

      // Remettre l'order courant à zéro
      this.orderService.setOrder(this.orderService.getEmptyOrder() as Order)

      this.snackBar.open(
        'Your reservation was sent successfully!',
        'Close',
        { duration: 3000 }
      )

      // Redirection vers les réservations après le snackbar
      setTimeout(() => this.router.navigate(['/user/trips']), 2000)

    } catch (err: any) {
      console.error('Confirm order error:', err)

      this.snackBar.open(
        err?.error?.error || 'Something went wrong. Please try again.',
        'Close',
        { duration: 4000 }
      )

      // Réinitialiser pour permettre un nouvel essai
      this.isAfterConfirm = false
      this.isLoading      = false
    }
  }

  // Bouton Close après confirmation — navigue directement vers /user/trips
  onClickClose () {
  this.router.navigate(['/user/trips'])
}
}