import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { AuthenticationProvider } from '../../providers/authentication/authentication';

import { HomePage } from '../../pages/home/home';
import { LoginPage } from '../../pages/login/login';

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {

  constructor(
    public modalCtrl: ModalController,
    private authProv: AuthenticationProvider,
    private translate: TranslateService) {

  }

  ngAfterViewInit() {
    //https://stackoverflow.com/a/45517166
    //this.slides.onlyExternal = true;
  }

  startLogin() {
    let modal = this.modalCtrl.create(LoginPage);
    modal.present();
  }

  openSignUpPage() {
    let modal = this.modalCtrl.create(LoginPage, {signUpScreen: true});
    modal.present();
  }
}
