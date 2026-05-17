import { Component, OnInit } from '@angular/core'
import { HttpService }       from 'src/app/services/http.service'

@Component({
  selector:    'admin-users',
  templateUrl: './users.component.html',
  styleUrls:   ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users:      any[]    = []
  isLoading:  boolean  = true
  searchTerm: string   = ''
  errorMsg:   string   = ''

  constructor(private httpService: HttpService) {}

  async ngOnInit() {
    await this.loadUsers()
  }

  async loadUsers() {
    this.isLoading = true
    this.errorMsg  = ''
    try {
      this.users = await this.httpService.get('admin/users', null) as any[]
    } catch (err) {
      console.error('loadUsers error:', err)
      this.errorMsg = 'Impossible de charger les utilisateurs'
    } finally {
      this.isLoading = false
    }
  }

  get filteredUsers() {
    if (!this.searchTerm) return this.users
    const term = this.searchTerm.toLowerCase()
    return this.users.filter(u =>
      u.name?.toLowerCase().includes(term)  ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    )
  }

  async onDeleteUser(id: string) {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) return
    try {
      await this.httpService.delete(`admin/users/${id}`, null)
      this.users = this.users.filter(u => u._id !== id)
    } catch (err: any) {
      console.error('delete user error:', err)
      alert(err?.error?.error || 'Erreur lors de la suppression')
    }
  }

  async onChangeRole(user: any, event: Event) {
    const newRole = (event.target as HTMLSelectElement).value
    if (newRole === user.role) return
    try {
      await this.httpService.patch(`admin/users/${user._id}/role`, { role: newRole })
      user.role = newRole
    } catch (err: any) {
      console.error('changeRole error:', err)
      alert(err?.error?.error || 'Erreur lors du changement de rôle')
    }
  }

  getRoleClass(role: string): string {
    const map: any = {
      admin: 'badge-danger',
      host:  'badge-info',
      guest: 'badge-success',
      user:  'badge-success',
    }
    return map[role] || ''
  }
}