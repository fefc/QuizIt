import { Component } from '@angular/core';
import { ViewController, LoadingController, AlertController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { AuthenticationProvider } from '../../providers/authentication/authentication';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  private signUpScreen: boolean;

  private email: string;
  private password: string;

  constructor(
    public viewCtrl: ViewController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private authProv: AuthenticationProvider,
    private translate: TranslateService,
    params: NavParams) {

    if (params.data.signUpScreen) {
      this.signUpScreen = true;
    } else {
      this.signUpScreen = false;
    }

    this.email = "";
    this.password = "";
  }

  login() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('LOGGING_IN')
    });

    loading.present();

    this.authProv.login(this.email, this.password).then((user) => {
      loading.dismiss();
      this.dismiss();
    }).catch((error) => {
      loading.dismiss();
      this.showAlert('ERROR_LOGGING_IN', error.code);
    });
  }

  signUp() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('CREATING')
    });

    loading.present();

    this.authProv.createAccount(this.email, this.password).then((user) => {
      loading.dismiss();
      this.dismiss();
    }).catch((error) => {
      loading.dismiss();
      this.showAlert('ERROR_SIGNING_UP', error.code);
    });
  }

  resetPassword() {
    let alert = this.alertCtrl.create({
      title: this.translate.instant('RESET_PASSWORD'),
      message: this.translate.instant('RESET_PASSWORD_INFO'),
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'email',
          placeholder: this.translate.instant('EMAIL'),
          type: 'email'
        }
      ],
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('OK'),
          handler: data => {
            let loading = this.loadingCtrl.create({
              content: this.translate.instant('RESETTING')
            });

            loading.present();

            this.authProv.resetPassword(data.email).then(() => {
              loading.dismiss();
              this.showAlert('RESET_PASSWORD', 'RESET_PASSWORD_CONFIRMATION');
            }).catch((error) => {
              loading.dismiss();
              this.showAlert('RESET_PASSWORD', error.code);
            });
          }
        }
      ]
    });

    alert.present();
  }

  enableLoginSignUpButton() {
    return this.email.length > 3 && this.password.length > 3;
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

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
