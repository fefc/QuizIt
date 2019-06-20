import { Component, ViewChild } from '@angular/core';
import { ViewController, Slides } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';

//declare var presentation: any;

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  private versionNumber: string;

  private presentation: any;

  constructor(public viewCtrl: ViewController, private appVersion: AppVersion) {
    if (appVersion) {
      this.appVersion.getVersionNumber().then((version) => {
        this.versionNumber = version;
      }).catch((error) => {
        console.log(error);
        this.versionNumber = "Unknown";
      });
    }

    this.presentation = (<any>window).Presentation

    if ((<any>window).navigator) {
      alert("HAPPY");

      (<any>window).navigator.presentation.onavailablechange = function(dict){
          if(dict.available){
              alert("available");

              (<any>window).navigator.presentation.requestSession("assets/httpd/indexs.html");
          } else {
              alert("non available");
          }
      };
    } else {
      alert("PAS HAPPY");
    }


  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
