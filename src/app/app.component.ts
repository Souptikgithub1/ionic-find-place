import { Component, OnInit, OnDestroy } from '@angular/core';

import { Platform, LoadingController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { Capacitor, Plugins, StatusBarStyle } from '@capacitor/core';
import { Subscription } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private authSub: Subscription;
  private prevAuthState: boolean = false;

  userEmail: string;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router,
    private authService: AuthService,
    private loadingCtrl: LoadingController
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.authSub = this.authService.isUserAuthenticated.pipe(
      take(1),
      switchMap(isAuth => {
        if (!isAuth && this.prevAuthState !== isAuth) {
          this.router.navigateByUrl('/auth');
        }
        this.prevAuthState = isAuth;
        return this.authService.userEmail;
      })
      ).subscribe(userEmail => {
        this.userEmail = userEmail
      });
  }

  ngOnDestroy() {
    if(!!this.authSub) this.authSub.unsubscribe();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      // this.splashScreen.hide();
      if (Capacitor.isPluginAvailable('StatusBar')) {
        Plugins.StatusBar.setBackgroundColor({
          color: '#de334d'
        });
      }
      
      if (Capacitor.isPluginAvailable('SplashScreen')) {
        Plugins.SplashScreen.hide();
      }
    });
  }

  onLogout() {
    this.loadingCtrl.create({
      message: 'Logging out...'
    }).then(loadingEL => {
      loadingEL.present();
      this.authService.logout();
      loadingEL.dismiss();
    });
    
  }
}
