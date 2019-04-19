import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthResponseData } from './interfaces/auth.interface';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  isLogin: boolean = true;

  constructor(private authService: AuthService,
              private router: Router,
              private loadingCtrl: LoadingController,
              private alertCtrl: AlertController) { }

  ngOnInit() {
  }

  onAuthenticate(email: string, password: string) {
    this.loadingCtrl.create({keyboardClose: true, message: 'Logging in...'})
                    .then(loadingEl => {
                      loadingEl.present();
                      
                      let authObs: Observable<AuthResponseData>;
                      if (this.isLogin) {
                        authObs = this.authService.login(email, password);
                      } else {
                        authObs = this.authService.signUp(email, password);
                      }

                      authObs.subscribe(res => {
                            loadingEl.dismiss();
                          this.router.navigateByUrl('places/tabs/discover');
                          }, errRes => {
                            const code = errRes.error.error.message;
                            let message = 'Could not sign you up, Please try again!';
                            if (code === 'EMAIL_EXISTS') {
                              message = 'This email id exists already!';
                            } else if (code === 'INVALID_EMAIL') {
                              message = 'This is not a valid email id!';
                            } else if (code === 'EMAIL_NOT_FOUND') {
                              message = 'E-mail Id doesn\'t exist!';
                            } else if (code === 'INVALID_PASSWORD') {
                              message = 'Incorrect password!';
                            } 
                            loadingEl.dismiss();
                            this.showAlert(message);
                          });
                    }); 
  }

  onSubmit(form: NgForm) {
    console.log(form.value.email, form.value.password);
    const email = form.value.email;
    const password = form.value.password;
    this.onAuthenticate(email, password);
    form.reset();
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  private showAlert(message: string) {
    this.alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['Ok']
    }).then(alertEL => {
      alertEL.present();
    });
  }

}
