import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-general-error',
  templateUrl: 'general-error.html'
})
export class GeneralErrorPage {
  private code: string;
  private error: string;

  constructor(
    private translate: TranslateService,
    params: NavParams) {

      //To avoid warings on ionic build
      this.code = this.code;
      this.error = this.error;

      this.code = params.data.code;
      this.error = JSON.stringify(params.data.error);
  }
}
