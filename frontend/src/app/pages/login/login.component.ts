import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { UploadImgService } from 'src/app/services/upload-img.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { faFacebookF, faTwitter, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faUser } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  @ViewChild('container') container: any
  constructor(
    private userService: UserService,
    private router: Router,
    private uploadImgService: UploadImgService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder) {
    this.formSignup = this.fb.group({
  fullname: ['', [Validators.required, Validators.minLength(3)]],
  email:    ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(3)]]
})
    this.formLogin = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(3)]]
})
  }
  faUser = faUser
  facebook = faFacebookF
  twitter = faTwitter
  google = faGoogle
  formSignup !: FormGroup
  formLogin !: FormGroup
  user!: User
  subscription!: Subscription
  isSignup: boolean = false
  imgData = {
    imgUrl: '',
    height: 500,
    width: 500
  }

  ngOnInit(): void {
  try {
    const empty = this.userService.getEmptyUser()
    if (empty) {
      this.formSignup.patchValue(empty)
      this.formLogin.patchValue(empty)
    }
  } catch(e) {
    console.error('getEmptyUser failed', e)
  }
}

 async onSubmit(type: string) {
  const coords = type === 'signup' ? this.formSignup.value : this.formLogin.value
  try {
    if (this.isSignup) {
      await this.userService.signup({
        ...coords,
        name: coords.fullname,
        imgUrl: this.imgData.imgUrl
      })
    } else {
      await this.userService.login(coords)
    }

    // ✅ Vérifier le rôle APRÈS le login
    const user = this.userService.getUser()
    if (user?.role === 'admin') {
      this.router.navigateByUrl('/admin')
    } else {
      this.router.navigateByUrl('')
    }

  } catch (err) {
    this.snackBar.open('Email ou mot de passe incorrect', 'Close', { duration: 3000 })
    console.log(err)
  }
}

 async onSignDemo() {
  try {
    await this.userService.login({ email: 'test@test.com', password: '123456' } as any)
    const user = this.userService.getUser()
    if (user?.role === 'admin') {
      this.router.navigateByUrl('/admin')
    } else {
      this.router.navigateByUrl('')
    }
  } catch (err) {
    this.snackBar.open('Demo user introuvable', 'Close', { duration: 3000 })
  }
}

  async uploadImg(ev: Event) {
    const { secure_url, height, width } = await this.uploadImgService.uploadImg(ev)
    this.imgData = { imgUrl: secure_url, width, height }
  }

  onToggleSign() {
    this.isSignup = !this.isSignup
  }
}
