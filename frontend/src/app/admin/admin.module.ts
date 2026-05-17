import { NgModule }                         from '@angular/core'
import { CommonModule }                     from '@angular/common'
import { RouterModule, Routes }             from '@angular/router'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { DashboardComponent }   from './pages/dashboard/dashboard.component'
import { ListingsComponent }    from './pages/listings/listings.component'
import { ListingFormComponent } from './pages/listing-form/listing-form.component'
import { UsersComponent }       from './pages/users/users.component'
import { BookingsComponent }    from './pages/bookings/bookings.component'
import { AdminNavComponent }    from './cmps/admin-nav/admin-nav.component'

const routes: Routes = [
  { path: '',                  component: DashboardComponent   },
  { path: 'listings',          component: ListingsComponent    },
  { path: 'listings/new',      component: ListingFormComponent },
  { path: 'listings/:id/edit', component: ListingFormComponent },
  { path: 'users',             component: UsersComponent       },
  { path: 'bookings',          component: BookingsComponent    },
]

@NgModule({
  declarations: [
    AdminNavComponent,     // ← EN PREMIER pour éviter les dépendances circulaires
    DashboardComponent,
    ListingsComponent,
    ListingFormComponent,
    UsersComponent,
    BookingsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    AdminNavComponent,     // ← AJOUTER exports
  ]
  // ← SUPPRIMER schemas: [CUSTOM_ELEMENTS_SCHEMA] — masquait les vraies erreurs
})
export class AdminModule {}