import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  styles: [`
    .list-md {
      margin: -1px 0 0;
    }`],
  template: `
    <ion-list>
      <button ion-item (click)="close(0)">{{ 'RENAME' | translate }}</button>
      <button ion-item (click)="close(1)">{{ 'DELETE' | translate }}</button>
    </ion-list>
  `
})

export class QuizQuestionsMenuCategory {
  constructor(public viewCtrl: ViewController) {

  }

  close(index: number) {
    this.viewCtrl.dismiss({index: index});
  }
}
