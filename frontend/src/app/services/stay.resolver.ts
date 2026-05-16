import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Stay } from '../models/stay.model';
import { StayService } from './stay.service';

@Injectable({ providedIn: 'root' })
export class StayResolver implements Resolve<Stay | null> {

  constructor(
    private stayService: StayService,
    private router: Router
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Stay | null> {
    const stayId = route.params['stayId']
    return from(
      this.stayService.query({ stayId } as any)
    ).pipe(
      map((result) => Array.isArray(result) ? result[0] ?? null : result),
      catchError(() => {
        this.router.navigateByUrl('/')
        return of(null)
      })
    )
  }
}