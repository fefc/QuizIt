import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Platform, ModalController, ViewController, LoadingController, AlertController, NavParams } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { TranslateService } from '@ngx-translate/core';

import { UserProfile } from '../../models/user-profile';

import { AuthenticationProvider } from '../../providers/authentication/authentication';

import { SignUpPage } from '../../pages/sign-up/sign-up';

const MAX_PICTURE_WIDTH: number = 512;
const MAX_PICTURE_HEIGHT: number = 512;

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
              private translate: TranslateService,
              params: NavParams) {
    //lets make deep copies, so that we don't modfiy anything before user confirmation
    if (!params.data.profile) {
      this.profile = {
        uuid: '',
        nickname: '',
        avatar : ''
      }
    } else {
      this.profile = JSON.parse(JSON.stringify(params.data.profile));

      if (['file:///', 'filesystem:'].some(extension => this.profile.avatar.startsWith(extension))) {
        this.profile.avatarUrl = this.sanitizer.bypassSecurityTrustUrl((<any> window).Ionic.WebView.convertFileSrc(this.profile.avatar));
      }
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

            this.authProv.updatePassword(data.password, data.newPassword).then(() => {
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

  logout() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('LOGGING_OUT')
    });

    loading.present();

    this.authProv.logout().then(() => {
      loading.dismiss();
      this.dismiss();
    }).catch((error) => {
      loading.dismiss();
      this.showOnlineAlert('ERROR_SIGNING_UP', error.code);
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

            this.authProv.deleteAccount(data.email, data.password).then(() => {
              //Has been deleted online, need to update local data, so save()
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
    this.imagePicker.getPictures({maximumImagesCount: 1, width:MAX_PICTURE_WIDTH, height: MAX_PICTURE_HEIGHT, quality: 90}).then((results) => {
      if (results.length === 1) {
        this.profile.avatar = decodeURIComponent(results[0]);
        this.profile.avatarUrl = this.sanitizer.bypassSecurityTrustUrl((<any> window).Ionic.WebView.convertFileSrc(this.profile.avatar));
      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }
}
