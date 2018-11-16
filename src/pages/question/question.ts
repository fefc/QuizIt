import { Component } from '@angular/core';
import { ViewController, AlertController, NavParams } from 'ionic-angular';

import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

@Component({
  selector: 'page-question',
  templateUrl: 'question.html'
})
export class QuestionPage {
  private categoryNames: Array<string>;
  private selectedCategoryName: string;
  private newQuestion: Question = {
    question: '',
    type: QuestionType.classic,
    rightAnswer: -1,
    answers: ['','','',''],
    extras: [],
    authorId: -1
  };

  constructor(public viewCtrl: ViewController, private alertCtrl: AlertController, params: NavParams) {
    this.categoryNames = params.data.categoryNames;
    this.selectedCategoryName = this.categoryNames[0];
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
    if (this.newQuestion.question) {
      if (this.newQuestion.question.length > 0) {
        if (this.newQuestion.rightAnswer !== -1) {
          for (let answer of this.newQuestion.answers) {
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
      this.viewCtrl.dismiss({question: this.newQuestion, categoryName: this.selectedCategoryName});
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
