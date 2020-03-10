import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-general-error',
  templateUrl: 'general-error.html'
})
export class GeneralErrorPage {
  private message: string;

  constructor(
    private translate: TranslateService,
    params: NavParams) {

      this.message = params.data.message;
  }
}
