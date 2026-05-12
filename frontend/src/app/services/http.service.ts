import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpService {

  BASE_URL = isDevMode() ? '//localhost:3000/api/' : '/api/'  // ← 3030 → 3000

  get headers() {                                              // ← dynamique
    const token = sessionStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  constructor() { }

  public get(endpoint: string, data?: any) {
    return this.httpRequest(endpoint, 'GET', data)
  }
  public post(endpoint: string, data?: any) {
    return this.httpRequest(endpoint, 'POST', data)
  }
  public put(endpoint: string, data: any) {
    return this.httpRequest(endpoint, 'PUT', data)
  }
  public patch(endpoint: string, data: any) {     // ← ajout patch (confirm/cancel)
    return this.httpRequest(endpoint, 'PATCH', data)
  }
  public delete(endpoint: string, data: any) {
    return this.httpRequest(endpoint, 'DELETE', data)
  }

  private async httpRequest(endpoint: string, method: string, data: any = null) {
    try {
      let url = `${this.BASE_URL}${endpoint}`
      const options: RequestInit = { method, headers: this.headers }

      if (data != null) {
        if (method === 'GET') {
          const query = new URLSearchParams(data).toString()
          if (query) url += (url.includes('?') ? '&' : '?') + query
        } else {
          options.body = JSON.stringify(data)
        }
      }

      const response = await fetch(url, options)
      if (response.status === 401) sessionStorage.clear()
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`Request failed with status ${response.status}: ${errorText}`)
      }
      return response.json()
    } catch (err: any) {
      console.log(`Had Issues ${method}ing to the backend, endpoint: ${endpoint}, with data: `, data)
      throw err
    }
  }
}