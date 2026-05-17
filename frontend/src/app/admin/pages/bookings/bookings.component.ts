import { Component, OnInit } from '@angular/core'
import { HttpService }       from 'src/app/services/http.service'

@Component({
  selector:    'admin-bookings',
  templateUrl: './bookings.component.html',
  styleUrls:   ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {

  bookings:     any[]   = []
  isLoading:    boolean = true
  filterStatus: string  = ''
  searchTerm:   string  = ''
  errorMsg:     string  = ''

  constructor(private httpService: HttpService) {}

  async ngOnInit() {
    await this.loadBookings()
  }

  async loadBookings() {
    this.isLoading = true
    this.errorMsg  = ''
    try {
      this.bookings = await this.httpService.get(
        'admin/bookings', null
      ) as any[]
    } catch (err) {
      console.error('loadBookings error:', err)
      this.errorMsg = 'Impossible de charger les réservations'
    } finally {
      this.isLoading = false
    }
  }

  get filteredBookings() {
    let result = this.bookings

    // Filtre par statut
    if (this.filterStatus) {
      result = result.filter(b => b.status === this.filterStatus)
    }

    // Filtre par recherche texte
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase()
      result = result.filter(b =>
        b.listing_id?.title?.toLowerCase().includes(term) ||
        b.guest_id?.name?.toLowerCase().includes(term)   ||
        b.guest_id?.email?.toLowerCase().includes(term)
      )
    }

    return result
  }

  // ─── Statistiques rapides ────────────────────────────────────────────────────
  get totalRevenue(): number {
    return this.bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0)
  }

  get countByStatus() {
    return {
      pending:   this.bookings.filter(b => b.status === 'pending').length,
      confirmed: this.bookings.filter(b => b.status === 'confirmed').length,
      cancelled: this.bookings.filter(b => b.status === 'cancelled').length,
      completed: this.bookings.filter(b => b.status === 'completed').length,
    }
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async onConfirm(id: string) {
    try {
      await this.httpService.patch(`bookings/${id}/confirm`, {})
      const booking = this.bookings.find(b => b._id === id)
      if (booking) booking.status = 'confirmed'
    } catch (err: any) {
      console.error('confirm error:', err)
      alert(err?.error?.error || 'Erreur lors de la confirmation')
    }
  }

  async onCancel(id: string) {
    if (!confirm('Annuler cette réservation ?')) return
    try {
      await this.httpService.patch(`bookings/${id}/cancel`, {})
      const booking = this.bookings.find(b => b._id === id)
      if (booking) booking.status = 'cancelled'
    } catch (err: any) {
      console.error('cancel error:', err)
      alert(err?.error?.error || 'Erreur lors de l\'annulation')
    }
  }

  async onDelete(id: string) {
    if (!confirm('Supprimer définitivement cette réservation ?')) return
    try {
      await this.httpService.delete(`admin/bookings/${id}`, null)
      this.bookings = this.bookings.filter(b => b._id !== id)
    } catch (err: any) {
      console.error('delete booking error:', err)
      alert(err?.error?.error || 'Erreur lors de la suppression')
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