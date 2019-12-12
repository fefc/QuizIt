import { Component } from '@angular/core';
import { Platform, ViewController } from 'ionic-angular';

@Component({
  styles: [`
    .list-md {
      margin: -1px 0 0;
    }`],
  template: `
    <ion-list>
      <button ion-item (click)="close(0)">{{ 'NEW_QUIZ' | translate }}</button>
      <button *ngIf="!platform.is('core')" ion-item (click)="close(1)">{{ 'IMPORT_QUIZ' | translate }}</button>
      <!--<button ion-item (click)="close(2)">{{ 'SETTINGS' | translate }}</button>-->
    </ion-list>
  `
})

export class HomeMenu {
  constructor(private platform: Platform,
              public viewCtrl: ViewController) {

  }

  close(index: number) {
    this.viewCtrl.dismiss({index: index});
  }
}
