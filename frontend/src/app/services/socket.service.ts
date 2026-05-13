import { Injectable, isDevMode } from '@angular/core';
import { io } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  socket: any = null
  readonly uri: string = isDevMode() ? '//localhost:3000' : ''  // ← 3030 → 3000

  readonly SOCKET_EMIT_ORDER_FOR_HOST = 'order-coming-emit'
  readonly SOCKET_EMIT_ORDER_FOR_USER = 'order-update-emit'
 
// ↓ AJOUTER ces deux lignes
readonly SOCKET_EVENT_ORDER_FOR_HOST = 'order-coming-emit'
readonly SOCKET_EVENT_ORDER_FOR_USER = 'order-update-emit'
  constructor() {
    try {
      this.socket = io(this.uri, { transports: ['websocket'], timeout: 3000 })
      this.socket.on('connect_error', () => {
        console.warn('Socket non disponible — mode dégradé')
        this.socket = null
      })
    } catch (e) {
      console.warn('Socket.io non disponible')
    }
  }

  emit(eventName: string, data: any) {
    if (this.socket) this.socket.emit(eventName, data)
  }

  on(eventName: string, cb: Function) {
    if (this.socket) this.socket.on(eventName, cb)
  }

  off(eventName: string, cb: Function | null = null) {
    if (!this.socket) return
    if (!cb) this.socket.removeAllListeners(eventName)
    else this.socket.removeListener(eventName, cb)
  }

  login(userId: string) {
    if (this.socket) this.socket.emit('set-user-socket', userId)
  }

  logout() {
    if (this.socket) this.socket.emit('unset-user-socket')
  }
}