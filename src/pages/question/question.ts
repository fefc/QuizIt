import { Component } from '@angular/core';
import { ViewController, AlertController, NavParams } from 'ionic-angular';

import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

@Component({
  selector: 'page-question',
  templateUrl: 'question.html'
})
export class QuestionPage {
  private title: string;
  private saveButtonName: string;
  private categoryNames: Array<string>;
  private selectedCategoryName: string;
  private question: Question;

  constructor(public viewCtrl: ViewController, private alertCtrl: AlertController, params: NavParams) {
    this.title = "Edit Question";
    this.saveButtonName = "Save";
    this.categoryNames = params.data.categoryNames;
    this.selectedCategoryName = params.data.selecteCategoryName;
    this.question = params.data.question;
    if (!this.question.question) {
      this.title = "New Question";
      this.saveButtonName = "Create";
    }
  }

  indexTracker(index: number, obj: any) {
    return index;
  }

  categoryChange(val: string) {
    if (val === "new") {
      let alert = this.alertCtrl.create({
        title: 'New category',
        inputs: [
          {
            name: 'categoryName',
            placeholder: 'Economics'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: data => {
              this.selectedCategoryName = this.categoryNames[0];
            }
          },
          {
            text: 'Create',
            handler: data => {
              if (data.categoryName.length > 3 && this.categoryNames.findIndex((category) => category === data.categoryName) === -1 ) {
                this.categoryNames.push(data.categoryName);
                this.selectedCategoryName = data.categoryName;
              }
              else {
                this.selectedCategoryName = this.categoryNames[0];

                let error = this.alertCtrl.create({
                  title: 'Error creating category',
                  message: 'Category name must be more than 3 characters long and should not already exist',
                  buttons: [
                    {
                      text: 'Ok',
                      role: 'ok',
                    }
                  ]
                });
                error.present();
              }
            }
          }
        ]
      });
      alert.present();
    }
  }

  enableCreateButton() {
    let enable: boolean = true;
    if (this.question.question) {
      if (this.question.question.length > 0) {
        if (this.question.rightAnswer !== -1) {
          for (let answer of this.question.answers) {
            if (answer.length === 0) {
              enable = false;
            }
          }
        }
        else {
          enable = false;
        }
      }
      else {
        enable = false;
      }
    }
    else {
      enable = false;
    }
    return enable;
  }

  create() {
    if (this.enableCreateButton()) {
      this.viewCtrl.dismiss({question: this.question, categoryName: this.selectedCategoryName});
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
