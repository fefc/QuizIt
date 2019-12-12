import { Component, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Platform, NavController, MenuController, ModalController, ViewController, LoadingController, AlertController, Slides } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { TranslateService } from '@ngx-translate/core';

import { UserProfile } from '../../models/user-profile';

import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';

import { HomePage } from '../../pages/home/home';

const MAX_PICTURE_WIDTH: number = 512;
const MAX_PICTURE_HEIGHT: number = 512;

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {
  private profile: UserProfile;

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
    private translate: TranslateService) {
    this.profile = {
      uuid: '',
      nickname: '',
      avatar : ''
    }
  }

  ngAfterViewInit() {
    //https://stackoverflow.com/a/45517166
    this.slides.onlyExternal = true;
  }

  goToStart() {
    this.slides.slideTo(0);
  }

  gotToCreateProfile(profile?: UserProfile) {
    if (profile) {
      this.profile = {
        uuid: profile.uuid,
        nickname: profile.nickname,
        avatar: profile.avatar,
        email: profile.email
      }
    }

    this.slides.slideTo(1);
  }

  createProfile(profile?: UserProfile) {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('CREATING')
    });

    loading.present();

    this.profilesProv.saveToStorage((profile !== undefined ? profile : this.profile)).then((savedProfile) => {
      this.navCtrl.setRoot(HomePage);
      this.menuCtrl.enable(true, 'menu-one');
      loading.dismiss();
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
