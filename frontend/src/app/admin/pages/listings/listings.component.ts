import { Component, OnInit } from '@angular/core'
import { HttpService }       from 'src/app/services/http.service'
import { Router }            from '@angular/router'

@Component({
  selector:    'admin-listings',
  templateUrl: './listings.component.html',
  styleUrls:   ['./listings.component.scss']
})
export class ListingsComponent implements OnInit {

  listings:   any[]    = []
  isLoading:  boolean  = true
  searchTerm: string   = ''

  constructor(
    private httpService: HttpService,
    private router:      Router
  ) {}

  async ngOnInit() {
    await this.loadListings()
  }

  async loadListings() {
    this.isLoading = true
    try {
      this.listings = await this.httpService.get('stay/', null) as any[]
    } catch (err) {
      console.error('loadListings error:', err)
    } finally {
      this.isLoading = false
    }
  }

  get filteredListings() {
    if (!this.searchTerm) return this.listings
    const term = this.searchTerm.toLowerCase()
    return this.listings.filter(l =>
      l.name?.toLowerCase().includes(term) ||
      l.loc?.city?.toLowerCase().includes(term)
    )
  }

  onEdit(id: string) {
    this.router.navigate(['/admin/listings', id, 'edit'])
  }

  async onDelete(id: string) {
    if (!confirm('Supprimer ce listing ?')) return
    try {
      await this.httpService.delete(`stay/${id}`, null)
      this.listings = this.listings.filter(l => l._id !== id)
    } catch (err) {
      console.error('delete error:', err)
      alert('Erreur lors de la suppression')
    }
  }

  onNew() {
    this.router.navigate(['/admin/listings/new'])
  }
}