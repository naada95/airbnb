// src/app/models/stay.model.ts

export interface Stay {
  _id:          string
  name:         string
  type:         string
  imgUrls:      string[]
  price:        number
  summary:      string
  capacity:     number
  amenities:    string[]
  bathrooms:    number
  bedrooms:     number
  roomType:     string
  host:         Host
  loc:          Loc
  reviews:      Review[]
  likedByUsers: string[]
  labels:       string[]
  statReviews:  StatReviews
}

export interface Host {
  _id:          string
  createAt:     number
  fullname:     string
  location?:    string
  about?:       string
  responseTime?: string
  thumbnailUrl?: string
  pictureUrl?:  string
  isSuperhost?: boolean
  policyNumber?: string
}

export interface Loc {
  country:     string
  countryCode: string
  city:        string
  address:     string
  lat:         number
  lan:         number
}

export interface Review {
  _id?:  string
  at:    number
  by:    ReviewBy
  txt:   string
}

export interface ReviewBy {
  _id:      string
  fullname: string
  imgUrl:   string
}

export interface StatReviews {
  cleanliness:   number
  communication: number
  checkIn:       number
  accuracy:      number
  location:      number
  value:         number
}

export interface StayFilter {
  likeByUser:   string
  place:        string
  label:        string
  hostId:       string
  isPetAllowed: string
  minPrice?:    number
  maxPrice?:    number
  guests?:      number
}

export interface googleMapLoc {
  lat: number
  lng: number
  name?: string
}