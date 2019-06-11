import { Component } from '@angular/core';
import { Platform, MenuController, ModalController, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

import { UserProfile } from '../models/user-profile';

import { UserProfilesProvider } from '../providers/user-profiles/user-profiles';
import { QuizsProvider } from '../providers/quizs/quizs';

import { StartPage } from '../pages/start/start';
import { AboutPage } from '../pages/about/about';
import { UserProfilePage } from '../pages/user-profile/user-profile';
import { HomePage } from '../pages/home/home';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  providers: [UserProfilesProvider, QuizsProvider]
})
export class AppComponent {
  rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,
    public menuCtrl: MenuController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private screenOrientation: ScreenOrientation,
    private profilesProv: UserProfilesProvider,
    private quizsProv: QuizsProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      //Eventually lock screen orientation on some devices
      if (platform.is('android')) {
        //width is dependent on screen orientation
        //if (Math.min(platform.width(), platform.height()) < 800) {
        //There is a bug with ImagePicker so force portrait anytime for now
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
        //}
      }
      this.profilesProv.loadFromStorage().then(() => {
        if (this.profilesProv.profiles.length > 0) {
          this.quizsProv.loadFromStorage().then(() => {
            //statusBar.styleDefault();
            this.rootPage = HomePage;
            splashScreen.hide();
          });
        } else {
          this.rootPage = StartPage;
          this.menuCtrl.enable(false, 'menu-one');
        }
      }).catch(() => {
      });
    });
  }

  openUserProfilePage() {
    let modal = this.modalCtrl.create(UserProfilePage, {profile: this.profilesProv.profiles[0]});
    modal.present();
    modal.onDidDismiss((data) => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: 'Saving changes...'
        });

        loading.present();

        this.profilesProv.profiles[0] = data;

        this.profilesProv.saveToStorage(data).then(() => {
          loading.dismiss();
        }).catch(() => {
          loading.dismiss();
          alert('Unable to save User profile.');
        });
      }
    });
  }

  openAboutPage() {
    let modal = this.modalCtrl.create(AboutPage);
    modal.present();
  }
}
