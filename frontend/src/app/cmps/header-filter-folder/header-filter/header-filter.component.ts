import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { Order } from 'src/app/models/order.model';
import { OrderService } from 'src/app/services/order.service';
import { Subscription } from 'rxjs';
import { CalendarOptions } from 'ngx-airbnb-calendar';
import { StayFilter } from 'src/app/models/stay.model';
import { StayService } from 'src/app/services/stay.service';
import { UtilService } from 'src/app/services/util.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'header-filter',
  templateUrl: './header-filter.component.html',
  styleUrls: ['./header-filter.component.scss']
})
export class HeaderFilterComponent implements OnInit, OnDestroy {
  @Input() isHeaderFilterActive!: boolean
  @Output() toggleHeaderFilter = new EventEmitter<void>()

  constructor(
    private orderService: OrderService,
    private stayService: StayService,
    private utilService: UtilService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  faMagnifyingGlass = faMagnifyingGlass
  modalNav          = ''
  searchFilter      = ''
  order!:           Order
  subscriptionOrder!:      Subscription
  subscriptionStayFilter!: Subscription
  date:    string | null = null
  isBlur:  boolean = false
  stayFilter!: StayFilter

  options: CalendarOptions = {
    format:          "yyyy/LL/dd",
    formatDays:      "eeeeee",
    firstCalendarDay: 1,
    closeOnSelected: false,
  }

  ngOnInit() {
    this.subscriptionOrder = this.orderService.order$.subscribe(
      order => this.order = order
    )
    this.subscriptionStayFilter = this.stayService.stayFilter$.subscribe(
      stayFilter => {
        this.stayFilter   = stayFilter
        // ✅ Sync searchFilter avec stayFilter.place au chargement
        this.searchFilter = stayFilter.place || ''
      }
    )
    this.date = this.dateFromOrder
  }

  // ─── Getters affichage header ────────────────────────────────────────────────

  get Anywhere() {
    return this.stayFilter?.place
      ? this.stayFilter.place
      : 'stay.header.anywhere'
  }

  get AnyWeek() {
    if (!this.order?.startDate || !this.order?.endDate || !this.date) {
      return 'stay.header.anyweek'
    }
    if (this.order.startDate.getMonth() === this.order.endDate.getMonth()) {
      const monthName = this.utilService.getMonthName(
        this.order.endDate.getMilliseconds()
      )
      return `${monthName} ${this.order.startDate.getDate()} - ${this.order.endDate.getDate()}`
    }
    const month1 = this.utilService.getMonthName(this.order.startDate.getMilliseconds())
    const month2 = this.utilService.getMonthName(this.order.endDate.getMilliseconds())
    return `${month1} ${this.order.startDate.getDate()} - ${month2} ${this.order.endDate.getDate()}`
  }

  get AddGuest() {
    const guests = this.order?.guests
    if (!guests) return 'stay.header.add-guests'
    if (
      guests.adults   === 1 &&
      guests.children === 0 &&
      guests.infants  === 0 &&
      guests.pets     === 0
    ) return 'stay.header.add-guests'
    return this.getGuests()
  }

  // ─── Navigation modales ──────────────────────────────────────────────────────

  onToggleHeaderFilter() {
    this.toggleHeaderFilter.emit()
  }

  setModalNav(val: string) {
    this.modalNav = val
  }

  onClickDate(val: string) {
    this.modalNav = val
  }

  onClickGuests(val: string) {
    this.setModalNav(val)
  }

  // ─── Recherche destination ───────────────────────────────────────────────────

  onSetWhereSearch(val: string) {
    this.searchFilter = val

    // ✅ Mettre à jour stayFilter.place en temps réel
    this.stayFilter = {
      ...this.stayFilter,
      place: val
    }

    if (val) this.setModalNav('search-place-modal')
    else     this.setModalNav('region-modal')
  }

  // Appelé depuis header-filter-modal quand l'user clique une suggestion
  setSearchFilter(place: string) {
    this.searchFilter = place

    // ✅ Mettre à jour stayFilter.place avec la suggestion cliquée
    this.stayFilter = {
      ...this.stayFilter,
      place: place
    }

    // Fermer le modal de suggestions
    this.setModalNav('')
  }

  // ─── Clic sur le bouton Rechercher ──────────────────────────────────────────

  onClickSearch() {
    // ✅ S'assurer que place est bien à jour depuis searchFilter
    const filterToApply: StayFilter = {
      ...this.stayFilter,
      place: this.searchFilter.trim(),
      // ✅ Ajouter le nombre de guests depuis l'order
      guests: (this.order?.guests?.adults   || 0) +
              (this.order?.guests?.children || 0)
    }

    // Mettre à jour les dates depuis le calendrier si présentes
    if (this.order?.startDate) {
      this.orderService.setOrder(this.order)
    }

    console.log('🔍 Filtre appliqué:', filterToApply)

    // ✅ Appeler setFilter avec le filtre complet
    this.stayService.setFilter(filterToApply)

    // Mettre à jour l'URL
    this.applyFilterToRoute(filterToApply)

    // Naviguer vers la home pour voir les résultats
    this.router.navigate(['/'])

    // Fermer le header filter
    this.onToggleHeaderFilter()
  }

  // ─── Dates ───────────────────────────────────────────────────────────────────

  get dateFromOrder() {
    if (
      !this.order?.startDate?.getMilliseconds ||
      !this.order?.startDate.getMilliseconds() ||
      !this.order?.endDate.getMilliseconds()
    ) return ''
    return this.order.startDate.toDateString() + '-' + this.order.endDate.toDateString()
  }

  getCheckIn() {
    if (this.date) {
      const dates = this.date?.split('-')
      if (dates.length >= 1) {
        this.order.startDate = new Date(dates[0])
        return new Date(dates[0])
      }
    }
    return
  }

  getCheckOut() {
    if (this.date) {
      const dates = this.date?.split('-')
      if (dates.length === 2) {
        this.order.endDate = new Date(dates[1])
        return new Date(dates[1])
      }
    }
    return
  }

  getGuests() {
    const g   = this.order?.guests
    if (!g) return ''
    let str   = (g.adults + g.children) > 0
      ? (g.adults + g.children) + ' guests '
      : ''
    str += g.infants > 0 ? ', ' + g.infants + ' infants ' : ''
    str += g.pets    > 0 ? ', ' + g.pets    + ' pets '    : ''
    return str
  }

  // ─── URL sync ────────────────────────────────────────────────────────────────

  private applyFilterToRoute(filter: StayFilter): void {
    // Nettoyer les valeurs vides pour ne pas polluer l'URL
    const cleanParams: any = {}
    Object.entries(filter).forEach(([key, val]) => {
      if (val !== '' && val !== 0 && val !== 'false' && val !== null) {
        cleanParams[key] = val
      }
    })

    this.router.navigate([], {
      relativeTo:          this.activatedRoute,
      queryParams:         cleanParams,
      queryParamsHandling: 'merge'
    })
  }

  ngOnDestroy() {
    this.subscriptionOrder?.unsubscribe()
    this.subscriptionStayFilter?.unsubscribe()
  }
}