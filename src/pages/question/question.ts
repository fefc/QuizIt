import { Component } from '@angular/core';
import { ViewController, AlertController, NavParams } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { File } from '@ionic-native/file';

import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

@Component({
  selector: 'page-question',
  templateUrl: 'question.html'
})
export class QuestionPage {
  private title: string;
  private saveButtonName: string;
  private categorys: Array<Category>;
  private question: Question;

  constructor(public viewCtrl: ViewController,
              private alertCtrl: AlertController,
              private file: File,
              private imagePicker: ImagePicker,
              params: NavParams) {
    //lets make deep copies, so that we don't modfiy anything before user confirmation
    this.categorys = [];

    for (let category of params.data.categorys) {
      this.categorys.push({name: category.name});
    }

    if (!params.data.question) {
      this.question = {
        uuid: '',
        question: '',
        type: QuestionType.classic,
        rightAnswer: -1,
        answers: ['','','',''],
        extras: [],
        category: {name: this.categorys[0].name},
        authorId: -1
      };

      this.title = "New Question";
      this.saveButtonName = "Create";
    }
    else {
      this.question = {
        uuid: params.data.question.uuid,
        question: params.data.question.question,
        type: params.data.question.type,
        rightAnswer: params.data.question.rightAnswer,
        answers: params.data.question.answers,
        extras: params.data.question.extras,
        category: {name: this.categorys.find((category) => category.name === params.data.question.category.name).name},
        authorId: params.data.question.authorId
      };

      this.title = "Edit Question";
      this.saveButtonName = "Save";
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
              this.question.category.name = this.categorys[0].name;
            }
          },
          {
            text: 'Create',
            handler: data => {
              if (data.categoryName.length > 3 && this.categorys.findIndex((category) => category.name === data.categoryName) === -1 ) {
                this.categorys.push({name: data.categoryName});
                this.question.category.name = data.categoryName;
              }
              else {
                this.question.category.name = this.categorys[0].name;

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

  //https://stackoverflow.com/a/52970316
  selectPicture() {
    this.imagePicker.getPictures({maximumImagesCount: 4}).then((results) => {
      for (var i = 0; i < results.length; i++) {
        this.question.answers[i] = results[i];//.replace(this.file.cacheDirectory, '');
      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }

  enableSaveButton() {
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

  save() {
    if (this.enableSaveButton()) {
      this.viewCtrl.dismiss({question: this.question});
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
