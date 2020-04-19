import { Component } from '@angular/core';
import { ModalController, LoadingController, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { AuthenticationProvider } from '../../providers/authentication/authentication';

import { LoginPage } from '../../pages/login/login';

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {

  constructor(
    public modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private authProv: AuthenticationProvider,
    private translate: TranslateService) {

  }

  ngAfterViewInit() {
    //https://stackoverflow.com/a/45517166
    //this.slides.onlyExternal = true;
  }

  openLoginPage() {
    let modal = this.modalCtrl.create(LoginPage);
    modal.present();
  }

  openSignUpPage() {
    let modal = this.modalCtrl.create(LoginPage, {signUpScreen: true});
    modal.present();
  }

  signInAnonymously() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('CREATING')
    });

    loading.present();

    this.authProv.signInAnonymously().then((user) => {
      loading.dismiss();
    }).catch((error) => {
      loading.dismiss();
      this.showAlert('ERROR_SIGNING_UP', error.code);
    });
  }

  showAlert(title: string, message: string) {
    let alertMsg = this.alertCtrl.create({
      title: this.translate.instant(title),
      message: this.translate.instant(message),
      enableBackdropDismiss: false,
      buttons: [
        {
          text: this.translate.instant('OK'),
          role: 'cancel',
        },
      ]
    });

    alertMsg.present();
  }
}
