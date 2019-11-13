import { Component } from '@angular/core';
import { ViewController, LoadingController, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { AuthenticationProvider } from '../../providers/authentication/authentication';

@Component({
  selector: 'page-sign-up',
  templateUrl: 'sign-up.html'
})
export class SignUpPage {

  private email: string;
  private password: string;

  constructor(public viewCtrl: ViewController,
              private loadingCtrl: LoadingController,
              private alertCtrl: AlertController,
              private authProv: AuthenticationProvider,
              public translate: TranslateService) {
    this.email = "";
    this.password = "";
  }

  create() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('CREATING')
    });

    loading.present();

    this.authProv.createAccount(this.email, this.password).then((user) => {
      loading.dismiss();
      this.viewCtrl.dismiss({user: user});
    }).catch((error) => {
      loading.dismiss();
      this.showSignInErrorAlert(error.code);
    });
  }

  enableCreateButton() {
    return this.email.length > 3 && this.password.length > 3;
  }

  showSignInErrorAlert(errorCode: string) {
    let alertMsg = this.alertCtrl.create({
      title: this.translate.instant('ERROR_SIGNING_UP'),
      message: this.translate.instant(errorCode),
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
