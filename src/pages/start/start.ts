import { Component, ViewChild } from '@angular/core';
import { NavController, MenuController, ViewController, LoadingController, Slides } from 'ionic-angular';

import { UserProfile } from '../../models/user-profile';

import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';

import { HomePage } from '../../pages/home/home';

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {
  @ViewChild(Slides) slides: Slides;

  private profile: UserProfile;

  constructor(public navCtrl: NavController,
    public menuCtrl: MenuController,
    public viewCtrl: ViewController,
    public loadingCtrl: LoadingController,
    private profilesProv: UserProfilesProvider) {
    this.profile = {
      uuid: '',
      nickname: '',
      avatar : ''
    }
  }

  gotToCreateProfile() {
    this.slides.slideTo(1);
  }

  createProfile() {
    let loading = this.loadingCtrl.create({
      content: 'Creating profile...'
    });

    loading.present();

    this.profilesProv.saveToStorage(this.profile).then(() => {
      loading.dismiss();
      this.navCtrl.setRoot(HomePage);
      this.menuCtrl.enable(true, 'menu-one');
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
}
