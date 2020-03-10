import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Platform, ModalController, ViewController, LoadingController, AlertController, NavParams } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { TranslateService } from '@ngx-translate/core';

import { UserProfile } from '../../models/user-profile';

import { AuthenticationProvider } from '../../providers/authentication/authentication';
import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';

import { SignUpPage } from '../../pages/sign-up/sign-up';

const MAX_PICTURE_WIDTH: number = 64;
const MAX_PICTURE_HEIGHT: number = 64;

@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html'
})

export class UserProfilePage {
  private profile: UserProfile;

  constructor(private platform: Platform,
              public modalCtrl: ModalController,
              public viewCtrl: ViewController,
              private loadingCtrl: LoadingController,
              private alertCtrl: AlertController,
              private imagePicker: ImagePicker,
              private sanitizer:DomSanitizer,
              private androidPermissions: AndroidPermissions,
              private authProv: AuthenticationProvider,
              private profilesProv: UserProfilesProvider,
              private translate: TranslateService,
              params: NavParams) {
    //lets make deep copies, so that we don't modfiy anything before user confirmation
    if (!params.data.profile) {
      this.profile = {
        uuid: '',
        nickname: '',
        avatar : '',
        email: ''
      }
    } else {
      this.profile = JSON.parse(JSON.stringify(params.data.profile));
    }
  }

  updatePassword() {
    let alert = this.alertCtrl.create({
      title: this.translate.instant('UPDATE_PASSWORD'),
      message: this.translate.instant('UPDATE_PASSWORD_INFO'),
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'password',
          placeholder: this.translate.instant('PASSWORD'),
          type: 'password'
        },
        {
          name: 'newPassword',
          placeholder: this.translate.instant('NEW_PASSWORD'),
          type: 'password'
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
              content: this.translate.instant('UPDATING')
            });

            loading.present();

            this.authProv.updatePassword(this.profile.email, data.password, data.newPassword).then(() => {
              loading.dismiss();
              this.showOnlineAlert('UPDATE_PASSWORD', 'UPDATE_PASSWORD_CONFIRMATION');
            }).catch((error) => {
              loading.dismiss();
              this.showOnlineAlert('UPDATE_PASSWORD', error.code);
            });
          }
        }
      ]
    });

    alert.present();
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
              this.showOnlineAlert('RESET_PASSWORD', 'RESET_PASSWORD_CONFIRMATION');
            }).catch((error) => {
              loading.dismiss();
              this.showOnlineAlert('RESET_PASSWORD', error.code);
            });
          }
        }
      ]
    });

    alert.present();
  }

  firstTimeLogin() {

  }

  login() {
    let alert = this.alertCtrl.create({
      title: this.translate.instant('LOG_IN'),
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'password',
          placeholder: this.translate.instant('PASSWORD'),
          type: 'password'
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
              content: this.translate.instant('LOGGING_IN')
            });

            loading.present();

            this.authProv.login(this.profile.email, data.password).then(() => {
              loading.dismiss();
            }).catch((error) => {
              loading.dismiss();
              this.showOnlineAlert('ERROR_LOGGING_IN', error.code);
            });
          }
        }
      ]
    });

    alert.present();
  }

  logout() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('LOGGING_OUT')
    });

    loading.present();

    this.authProv.logout().then(() => {
      loading.dismiss();
    }).catch((error) => {
      loading.dismiss();
      this.showOnlineAlert('ERROR_SIGNING_UP', error.code);
    });
  }

  openSignUpPage() {
    let modal = this.modalCtrl.create(SignUpPage);
    modal.present();

    modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: this.translate.instant('CREATING')
        });

        loading.present();

        this.profilesProv.saveToOnline(this.profile).then(() => {
          loading.dismiss();
          this.save();
        }).catch((error) => {
          loading.dismiss();
          alert('Unable to save User profile online. ' + error.code);
          this.dismiss();
        });
      }
    });
  }

  deleteAccount() {
    let alert = this.alertCtrl.create({
      title: this.translate.instant('DELETE_ACCOUNT'),
      message: this.translate.instant('DELETE_ACCOUNT_INFO'),
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'email',
          placeholder: this.translate.instant('EMAIL'),
          type: 'email'
        },
        {
          name: 'password',
          placeholder: this.translate.instant('PASSWORD'),
          type: 'password'
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
              content: this.translate.instant('DELETING')
            });

            loading.present();

            this.authProv.deleteAccount(this.profile.email, data.password).then(() => {
              //Has been deleted online, need to update local data, so save()
              this.profile.email = undefined;
              this.save();
              loading.dismiss();
              this.showOnlineAlert('DELETE_ACCOUNT', 'DELETE_ACCOUNT_CONFIRMATION');
            }).catch((error) => {
              loading.dismiss();
              this.showOnlineAlert('DELETE_ACCOUNT', error.code);
            });
          }
        }
      ]
    });

    alert.present();
  }

  showOnlineAlert(title: string, message: string) {
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

  enableSaveButton() {
    let enable: boolean = false;
    if (this.profile.nickname) {
      if (this.profile.nickname.length > 2) {
        enable = true;
      }
    }
    return enable;
  }

  save() {
    if (this.enableSaveButton()) {
      this.viewCtrl.dismiss(this.profile);
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  openImagePicker() {
    if (this.platform.is('android')) {
      this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
      .then(status => {
        if (status.hasPermission) {
          this.openMobileImagePicker();
        } else {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
          .then(status => {
            if(status.hasPermission) {
              this.openMobileImagePicker();
            }
          });
        }
      });
    } else {
      this.openMobileImagePicker();
    }
  }

  openMobileImagePicker() {
    this.imagePicker.getPictures({maximumImagesCount: 1, width:MAX_PICTURE_WIDTH, height: MAX_PICTURE_HEIGHT, quality: 80, outputType: 1}).then((results) => {
      if (results.length === 1) {
        this.profile.avatar = 'data:image/jpeg;base64,' + results[0];
      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }

  renderPicture(base64: string) {
    return this.sanitizer.bypassSecurityTrustUrl(base64);
  }
}
