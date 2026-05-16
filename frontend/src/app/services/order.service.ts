import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FilterOrder, Order } from '../models/order.model';
import { HttpService } from './http.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(
    private httpService: HttpService,
    private socketService: SocketService,
  ) { }

  ORDER_STORAGE_KEY = 'orders'
  ORDER_URL = 'bookings/'

  private _orders$ = new BehaviorSubject<Order[]>([])
  public orders$ = this._orders$.asObservable()

  private _order$ = new BehaviorSubject<Order>(this.getEmptyOrder() as Order)
  public order$ = this._order$.asObservable()

  private _orderFilter$ = new BehaviorSubject<FilterOrder>(this.getEmptyFilter())
  public orderFilter$ = this._orderFilter$.asObservable()

  // ─── Méthode privée partagée : mapping backend → frontend ───────────────────
  private _mapBookingToOrder(b: any): Order {
    return {
      _id:        b._id,
      startDate:  new Date(b.check_in),
      endDate:    new Date(b.check_out),
      totalPrice: b.total_price,
      status:     b.status,
      stay: {
        _id:   b.listing_id?._id            || b.listing_id,
        name:  b.listing_id?.title          || 'Listing',
        price: b.listing_id?.price_per_night || 0
      },
      host: {
        _id:      b.listing_id?.host?.host_id || '',
        fullname: b.listing_id?.host?.name    || 'Host'
      },
      buyer: {
        _id:      b.guest_id || '',
        fullname: ''
      },
      guests: {
        adults:   b.guests_count || 1,
        children: 0,
        infants:  0,
        pets:     0
      }
    }
  }

  // ─── getCurrOrder ────────────────────────────────────────────────────────────
  public getCurrOrder() {
    return Promise.resolve(this._order$.value)
  }

  // ─── loadOrders ─────────────────────────────────────────────────────────────
  public async loadOrders() {
  const filterBy = this._orderFilter$.value
  let endpoint = filterBy.hostId
    ? `${this.ORDER_URL}listing/${filterBy.hostId}`
    : `${this.ORDER_URL}my`
  const raw = await this.httpService.get(endpoint, null)
  const orders = raw.map((b: any) => ({
    _id:        b._id,
    startDate:  new Date(b.check_in),
    endDate:    new Date(b.check_out),
    totalPrice: b.total_price,
    status:     b.status,
    stay: {
      _id:   typeof b.listing_id === 'object' ? b.listing_id._id : b.listing_id,
      name:  b.listing_id?.title || 'Listing',
      price: b.listing_id?.price_per_night || 0
    },
    host: {
      _id:      b.listing_id?.host?.host_id || '',
      fullname: b.listing_id?.host?.host_name || 'Host'
    },
    buyer: {
      _id:      b.guest_id || '',
      fullname: ''
    },
    guests: {
      adults:   b.guests_count || 1,
      children: 0,
      infants:  0,
      pets:     0
    }
  }))
  this._orders$.next(orders)
}

  // ─── query ───────────────────────────────────────────────────────────────────
  public query(filterBy: FilterOrder | null) {
    const queryParams = this.getQueryParams(filterBy)
    return this.httpService.get(this.ORDER_URL + queryParams, null)
  }

  // ─── save ────────────────────────────────────────────────────────────────────
  public async save(order: Order) {
  if (order._id) {
    this.socketService.emit(this.socketService.SOCKET_EVENT_ORDER_FOR_USER, order)
    return await this.httpService.patch(`${this.ORDER_URL}${order._id}/confirm`, order)
  }
  const payload = {
    listing_id:    order.stay._id,
    check_in:      order.startDate,
    check_out:     order.endDate,
    guests_count:  order.guests.adults + order.guests.children,
    total_price:   order.totalPrice,
    special_notes: ''
  }
  this.socketService.emit(this.socketService.SOCKET_EVENT_ORDER_FOR_HOST, order)
  return await this.httpService.post(this.ORDER_URL, payload)
}

  // ─── getEmptyFilter ──────────────────────────────────────────────────────────
  public getEmptyFilter() {
    return {
      stayName:   '',
      hostName:   '',
      checkIn:    new Date(),
      checkOut:   new Date(),
      totalPrice: 0,
      status:     '',
      hostId:     '',
      buyerId:    '',
      term:       ''
    }
  }

  // ─── setFilter ───────────────────────────────────────────────────────────────
  public setFilter(filter: FilterOrder) {
    this._orderFilter$.next(filter)
    this.loadOrders().catch(err =>
      console.error('loadOrders failed:', err)
    )
  }

  // ─── setOrder ────────────────────────────────────────────────────────────────
  public setOrder(order: Order) {
    this._order$.next(order)
  }

  // ─── getEmptyOrder ───────────────────────────────────────────────────────────
  public getEmptyOrder() {
    return {
      buyer: {
        _id:      '',
        fullname: ''
      },
      totalPrice: 0,
      startDate:  new Date(0),
      endDate:    new Date(0),
      guests: {
        adults:   1,
        children: 0,
        infants:  0,
        pets:     0
      },
      host: {
        _id:      '',
        fullname: ''
      },
      stay: {
        _id:   '',
        name:  '',
        price: 0
      },
      status: 'pending'
    }
  }

  // ─── getQueryParams ──────────────────────────────────────────────────────────
  private getQueryParams(filterBy: FilterOrder | null) {
    let params = '?'
    if (filterBy?.term)       params += `term=${filterBy.term}&`
    if (filterBy?.hostId)     params += `hostId=${filterBy.hostId}&`
    if (filterBy?.buyerId)    params += `buyerId=${filterBy.buyerId}&`
    if (filterBy?.status)     params += `status=${filterBy.status}&`
    if (filterBy?.stayName)   params += `stayName=${filterBy.stayName}&`
    if (filterBy?.hostName)   params += `hostName=${filterBy.hostName}&`
    if (filterBy?.totalPrice) params += `totalPrice=${filterBy.totalPrice}&`
    return params
  }
}
