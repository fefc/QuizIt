import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  private versionNumber: string; //for use in Angular html

  constructor(public viewCtrl: ViewController, private appVersion: AppVersion) {
    if (appVersion) {
      this.appVersion.getVersionNumber().then((version) => {
        this.versionNumber = version;
      }).catch((error) => {
        console.log(error);
        this.versionNumber = "Unknown";
      });
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
