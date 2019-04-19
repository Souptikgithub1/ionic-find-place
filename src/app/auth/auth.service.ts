import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthResponseData } from "./interfaces/auth.interface";
import { environment } from "../../environments/environment";
import { BehaviorSubject, from } from "rxjs";
import { User } from "./models/user.model";
import { map, tap } from "rxjs/operators";
import { Plugins } from '@capacitor/core';

@Injectable({
  providedIn: "root"
})
export class AuthService implements OnDestroy {
  private _user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  private autoLogoutTimer: any;

  constructor(private http: HttpClient) {}

  signUp(email: string, password: string) {
    return this.http.post<AuthResponseData>(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=${environment.apiKey}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    ).pipe(tap(this.setUserData.bind(this)));
  }

  get isUserAuthenticated() {
    return this._user.asObservable().pipe(
      map(user => {
        if (!!user) {
          return !!user.token;
        } else {
          return false;
        }
      })
    );
  }

  get userId() {
    return this._user.asObservable().pipe(
      map(user => {
        if (!!user) {
          return user.id;
        } else {
          return null;
        }
      })
    );
  }

  get userEmail() {
    return this._user.asObservable().pipe(
      map(user => {
        if (!!user) {
          return user.email;
        } else {
          return null;
        }       
      })
    );
  }

  autoLogin() {
    return from(Plugins.Storage.get({key: 'authData'})).pipe(
      map(storedData => {
        if (!storedData || !storedData.value) {
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as {
          userId: string;
          email: string;
          token: string;
          tokenExpirationDate: string;
        };
        const expirationTime = new Date(parsedData.tokenExpirationDate);
        if (expirationTime <= new Date()) {
          return null;
        }
        const user = new User(
          parsedData.userId,
          parsedData.email,
          parsedData.token,
          expirationTime
        );
        return user;
      }),
      tap(user => {
        if (!!user) {
          this._user.next(user);
          this.autoLogout(user.tokenDuration);
        }
      }),
      map(user => {
        return !!user;
      })
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponseData>(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${
        environment.apiKey
      }`,
      {
        email,
        password,
        returnSecureToken: true
      }
    ).pipe(tap(this.setUserData.bind(this)));
  }

  private setUserData(userRes: AuthResponseData) {
    const tokenExpirationDate = new Date(
      new Date().getTime() + (+userRes.expiresIn * 1000)
    );
    let user = new User(
      userRes.localId,
      userRes.email,
      userRes.idToken,
      tokenExpirationDate
    );
    this._user.next(user);
    this.autoLogout(user.tokenDuration);
    this.storeAuthData(userRes.localId, userRes.email, userRes.idToken, tokenExpirationDate.toISOString());
  }

  private storeAuthData(userId: string, email: string, token: string, tokenExpirationDate: string) {
    const data = JSON.stringify({
      userId, 
      email,
      token, 
      tokenExpirationDate
    });
    Plugins.Storage.set({ key: 'authData', value: data});
  }

  logout() {
    this.clearAutoLogoutTimer();
    this._user.next(null);
    Plugins.Storage.remove({key: 'authData'});
  }

  autoLogout(duration: number) {
    this.clearAutoLogoutTimer();
    this.autoLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  clearAutoLogoutTimer() {
    if (!!this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }
  }

  ngOnDestroy() {
    this.clearAutoLogoutTimer();
  }
}
