import { Component } from '@angular/core';
import { Platform, ModalController, ViewController, LoadingController, AlertController, NavParams } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { TranslateService } from '@ngx-translate/core';

import { UserProfile } from '../../models/user-profile';

import { AuthenticationProvider } from '../../providers/authentication/authentication';
import { ConnectionProvider } from '../../providers/connection/connection';

import { LoginPage } from '../../pages/login/login';

const MAX_PICTURE_WIDTH: number = 512;
const MAX_PICTURE_HEIGHT: number = 512;
const MAX_FILE_SIZE: number = 512000; //OCTETS

@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html'
})

export class UserProfilePage {
  private profile: UserProfile;

  private profileMustBeUpdated: boolean; //for use in Angular html

  constructor(private platform: Platform,
              public modalCtrl: ModalController,
              public viewCtrl: ViewController,
              private loadingCtrl: LoadingController,
              private alertCtrl: AlertController,
              private imagePicker: ImagePicker,
              private androidPermissions: AndroidPermissions,
              private authProv: AuthenticationProvider,
              private connProv: ConnectionProvider,
              private translate: TranslateService,
              params: NavParams) {

    this.profileMustBeUpdated = params.data.profileMustBeUpdated;
    //To avoid warings on ionic build
    this.profileMustBeUpdated = this.profileMustBeUpdated;
    
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
        setTimeout(async () =>  {
          this.profile.avatarUrl = await this.connProv.getLocalFileUrl(this.profile.avatar);
        }, 0); //Constructor can't get aysnc so let's do it my way.
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
              loading.dismiss();
              this.dismiss();
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

  deleteAnonymousAccount() {
    let alert = this.alertCtrl.create({
      title: this.translate.instant('DELETE_ACCOUNT'),
      message: this.translate.instant('DELETE_ACCOUNT_INFO'),
      enableBackdropDismiss: false,
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

            this.authProv.deleteAnonymousAccount().then(() => {
              //Has been deleted online, need to update local data, so save()
              loading.dismiss();
              this.dismiss();
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

  linkAccount() {
    let modal = this.modalCtrl.create(LoginPage, {signUpScreen: true});
    modal.present();
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
    this.imagePicker.getPictures({maximumImagesCount: 1, width:MAX_PICTURE_WIDTH, height: MAX_PICTURE_HEIGHT, quality: 90}).then(async (results) => {
      if (results.length === 1) {
        let decodedURI = decodeURIComponent(results[0]);

        if (await this.connProv.isFileSizeValid(decodedURI, MAX_FILE_SIZE)) {
          this.profile.avatar = decodeURIComponent(decodedURI);
          this.profile.avatarUrl = await this.connProv.getLocalFileUrl(decodedURI);
        } else {
          this.showFileToBigAlert();
        }


      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }

  showFileToBigAlert() {
    let error = this.alertCtrl.create({
      title: this.translate.instant('ERROR_FILE_TOO_BIG'),
      message: this.translate.instant('ERROR_FILE_TOO_BIG_INFO') + ' ' + (MAX_FILE_SIZE / 1000) + 'KB.',
      buttons: [
        {
          text: this.translate.instant('OK'),
          role: 'ok',
        }
      ]
    });
    error.present();
  }
}
