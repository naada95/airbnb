import { Component, OnInit } from '@angular/core'
import { HttpService }       from 'src/app/services/http.service'
import { Router }            from '@angular/router'

@Component({
  selector:    'admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls:   ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  stats = {
    totalListings: 0,
    totalUsers:    0,
    totalBookings: 0,
    revenue:       0,
  }

  recentBookings: any[]   = []
  isLoading:      boolean = true

  constructor(
    private httpService: HttpService,
    private router:      Router
  ) {}

  async ngOnInit() {
    await this.loadStats()
  }

  async loadStats() {
  this.isLoading = true
  try {
    // ✅ Une seule requête pour toutes les stats
    const stats: any = await this.httpService.get('admin/stats', null)

    this.stats.totalListings = stats.totalListings || 0
    this.stats.totalUsers    = stats.totalUsers    || 0
    this.stats.totalBookings = stats.totalBookings || 0
    this.stats.revenue       = stats.revenue       || 0

    // Charger les réservations récentes séparément
    const bookings = await this.httpService.get(
      'admin/bookings?limit=5', null
    ) as any[]
    this.recentBookings = bookings

  } catch (err) {
    console.error('loadStats error:', err)
  } finally {
    this.isLoading = false
  }
}

  getStatusClass(status: string): string {
    const map: any = {
      pending:   'badge-warning',
      confirmed: 'badge-success',
      cancelled: 'badge-danger',
      completed: 'badge-info',
    }
    return map[status] || ''
  }
}