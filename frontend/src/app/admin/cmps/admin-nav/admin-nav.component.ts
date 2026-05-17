import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { UserService } from '../../../services/user.service' // ✅ Verify this path

@Component({
  selector: 'admin-nav', // ✅ Matches <admin-nav> usage in templates
  templateUrl: './admin-nav.component.html',
  styleUrls: ['./admin-nav.component.scss']
})
export class AdminNavComponent {

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  onLogout() {
    this.userService.logout()
    this.router.navigate(['/'])
  }
}