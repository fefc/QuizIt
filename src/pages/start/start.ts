import { Component, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Platform, NavController, MenuController, ModalController, ViewController, LoadingController, AlertController, NavParams, Slides } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { TranslateService } from '@ngx-translate/core';

import { UserProfile } from '../../models/user-profile';

import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';
import { AuthenticationProvider } from '../../providers/authentication/authentication';

import { HomePage } from '../../pages/home/home';
import { LoginPage } from '../../pages/login/login';

const MAX_PICTURE_WIDTH: number = 64;
const MAX_PICTURE_HEIGHT: number = 64;

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {
  private profile: UserProfile;

  private email: string;
  private password: string;

  @ViewChild(Slides) slides: Slides;

  constructor(private platform: Platform,
    public navCtrl: NavController,
    public menuCtrl: MenuController,
    public modalCtrl: ModalController,
    public viewCtrl: ViewController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private imagePicker: ImagePicker,
    private androidPermissions: AndroidPermissions,
    private sanitizer:DomSanitizer,
    private profilesProv: UserProfilesProvider,
    private authProv: AuthenticationProvider,
    private translate: TranslateService,
    params: NavParams) {
    this.profile = {
      uuid: '',
      nickname: '',
      avatar : ''
    }

    this.email = '';
    this.password = '';

    if (params.data) {
      if (params.data.slide === 2) {
        this.gotToCreateProfile();
      }
    }
  }

  ngAfterViewInit() {
    //https://stackoverflow.com/a/45517166
    this.slides.onlyExternal = true;
  }

  goToStart() {
    this.slides.slideTo(0);
  }

  gotToLogin() {
    this.slides.slideTo(1);
  }

  gotToCreateProfile() {
    this.slides.slideTo(2);
  }

  startLogin() {
    let modal = this.modalCtrl.create(LoginPage);
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

  enableLoginButton() {
    return this.email.length > 3 && this.password.length > 3;
  }

  openHomePage() {
    this.navCtrl.setRoot(HomePage);
    this.menuCtrl.enable(true, 'menu-one');
  }

  openSignUpPage() {
    let modal = this.modalCtrl.create(LoginPage, {signUpScreen: true});
    modal.present();
  }

  createProfile() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('CREATING')
    });

    loading.present();

    this.profilesProv.createOnline(this.profile).then(() => {
      loading.dismiss();
      this.openHomePage();
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save User profile.');
    });
  }

  enableCreateButton() {
    let enable: boolean = false;
    if (this.profile.nickname) {
      if (this.profile.nickname.length > 2) {
        enable = true;
      }
    }
    return enable;
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
