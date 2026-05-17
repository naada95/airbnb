import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { HttpService } from 'src/app/services/http.service'

@Component({
  selector:    'admin-listing-form',
  templateUrl: './listing-form.component.html',
  styleUrls:   ['./listing-form.component.scss']
})
export class ListingFormComponent implements OnInit {

  isEditMode:  boolean = false
  isLoading:   boolean = false
  isSaving:    boolean = false
  listingId:   string  = ''

  // Formulaire
  form = {
    name:        '',
    summary:     '',
    price:       0,
    capacity:    1,
    bedrooms:    1,
    bathrooms:   1,
    roomType:    'Entire home/apt',
    city:        '',
    country:     '',
    address:     '',
    lat:         0,
    lan:         0,
    imgUrls:     [] as string[],
    amenities:   [] as string[],
  }

  roomTypes = [
    'Entire home/apt',
    'Private room',
    'Shared room',
    'Hotel room',
  ]

  amenitiesList = [
    'Wifi', 'Kitchen', 'Washer', 'Dryer',
    'Air conditioning', 'Heating', 'TV',
    'Parking', 'Pool', 'Hot tub',
    'Pets allowed', 'Gym', 'Elevator',
  ]

  newImgUrl = ''

  constructor(
    private httpService:    HttpService,
    private router:         Router,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id')

    if (id && id !== 'new') {
      this.isEditMode = true
      this.listingId  = id
      await this.loadListing(id)
    }
  }

  async loadListing(id: string) {
    this.isLoading = true
    try {
      const listing: any = await this.httpService.get(`stay/${id}`, null)

      // Remplir le formulaire avec les données existantes
      this.form = {
        name:      listing.name      || '',
        summary:   listing.summary   || '',
        price:     listing.price     || 0,
        capacity:  listing.capacity  || 1,
        bedrooms:  listing.bedrooms  || 1,
        bathrooms: listing.bathrooms || 1,
        roomType:  listing.roomType  || 'Entire home/apt',
        city:      listing.loc?.city    || '',
        country:   listing.loc?.country || '',
        address:   listing.loc?.address || '',
        lat:       listing.loc?.lat     || 0,
        lan:       listing.loc?.lan     || 0,
        imgUrls:   listing.imgUrls   || [],
        amenities: listing.amenities || [],
      }
    } catch (err) {
      console.error('loadListing error:', err)
      alert('Impossible de charger le listing')
      this.router.navigate(['/admin/listings'])
    } finally {
      this.isLoading = false
    }
  }

  // ─── Images ──────────────────────────────────────────────────────────────────

  onAddImg() {
    const url = this.newImgUrl.trim()
    if (!url) return
    if (this.form.imgUrls.includes(url)) return
    this.form.imgUrls.push(url)
    this.newImgUrl = ''
  }

  onRemoveImg(index: number) {
    this.form.imgUrls.splice(index, 1)
  }

  // ─── Amenities ───────────────────────────────────────────────────────────────

  isAmenityChecked(amenity: string): boolean {
    return this.form.amenities.includes(amenity)
  }

  onToggleAmenity(amenity: string) {
    const idx = this.form.amenities.indexOf(amenity)
    if (idx === -1) {
      this.form.amenities.push(amenity)
    } else {
      this.form.amenities.splice(idx, 1)
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async onSubmit() {
  if (!this.form.name || !this.form.price) {
    alert('Le nom et le prix sont obligatoires')
    return
  }

  this.isSaving = true

  // ✅ Transformer Angular → Backend
  const payload: any = {
    title:           this.form.name,
    description:     this.form.summary,
    price_per_night: Number(this.form.price),
    accommodates:    Number(this.form.capacity),
    bedrooms:        Number(this.form.bedrooms),
    bathrooms:       Number(this.form.bathrooms),
    room_type:       this.form.roomType,
    photos:          this.form.imgUrls,
    amenities:       this.form.amenities,
    location: {
      city:    this.form.city,
      country: this.form.country,
      street:  this.form.address,
      coordinates: {
        type:        'Point',
        coordinates: [Number(this.form.lan), Number(this.form.lat)]
      }
    }
  }

  console.log('📦 Payload envoyé:', payload)

  try {
    if (this.isEditMode) {
      await this.httpService.put(`stay/${this.listingId}`, payload)
      alert('Listing mis à jour ✅')
    } else {
      await this.httpService.post('stay/', payload)
      alert('Listing créé ✅')
    }
    this.router.navigate(['/admin/listings'])
  } catch (err: any) {
    console.error('save error:', err)
    alert(err?.error?.error || 'Erreur lors de la sauvegarde')
  } finally {
    this.isSaving = false
  }
}
  onCancel() {
  this.router.navigate(['/admin/listings'])
}
}
