import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';

import { Quiz } from '../../models/quiz';
import { Question } from '../../models/question';

/*
  Generated class for the QuizsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class QuizsProvider {
  public quizs: Array<Quiz>;

  constructor(private storage: Storage) {
    this.quizs = new Array<Quiz>();
  }

  loadFromStorage() {
    return new Promise((resolve, reject) => {
      this.storage.get('quizs').then(data => {
        if (data) {
          this.quizs = JSON.parse(data);
          resolve();
        }
      }).catch(() => {
        reject();
      });
    });
  }

  saveToStorage(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      if (!quiz.uuid) {
        //We have a new quiz, so first we need to get a new uuid
        let uuid: string = this.uuidv4();

        while (this.quizs.findIndex((q) => q.uuid === uuid) !== -1) {
          uuid = this.uuidv4();
        }

        let newQuiz: Quiz = {
          uuid: uuid,
          title: quiz.title,
          creationDate: quiz.creationDate,
          categorys: quiz.categorys,
          questions: quiz.questions
        }

        this.quizs.push(newQuiz);
        this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          quiz = newQuiz;
          resolve();
        }).catch(() => {
          this.quizs.pop();
          reject();
        });
      }
      else {
        //Saving an exsisting quiz, lets just make sure it's in the list
        let quizIndex: number = this.quizs.findIndex((q) => q.uuid === quiz.uuid);
        if (quizIndex !== -1) {
          //Check questions uuid, if there is one not set, generate one
          let questionIndex: number = quiz.questions.findIndex((q) => !q.uuid);

          while (questionIndex !== -1) {
            let uuid: string = this.uuidv4();

            while (quiz.questions.findIndex((q) => q.uuid === uuid) !== -1) {
              uuid = this.uuidv4();
            }

            let questionUUID: Question = {
              uuid: uuid,
              question: quiz.questions[questionIndex].question,
              type: quiz.questions[questionIndex].type,
              rightAnswer: quiz.questions[questionIndex].rightAnswer,
              answers: quiz.questions[questionIndex].answers,
              extras: quiz.questions[questionIndex].extras,
              category: quiz.questions[questionIndex].category,
              authorId: quiz.questions[questionIndex].authorId
            }

            quiz.questions[questionIndex] = questionUUID;

            questionIndex = quiz.questions.findIndex((q) => !q.uuid);
          }

          this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
            resolve();
          }).catch(() => {
            reject();
          });
        }
        else {
          reject();
        }
      }
    });
  }

  deleteSelectedFromStorage() {
    return new Promise((resolve, reject) => {
      let indexes: Array<number> = Array<number>();

      for (let selectedQuiz of this.quizs.filter((quiz) => quiz.selected === true)) {
        let index = this.quizs.findIndex(quiz => quiz.uuid === selectedQuiz.uuid);
        if (index !== -1) {
          indexes.push(index);
        }
      }

      indexes.sort(function(a,b){ return b - a; });

      for (let index of indexes) {
        this.quizs.splice(index, 1);
      }

      this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
        resolve();
      }).catch(() => {
        reject();
      });
    });
  }

  deleteFromStorage(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      let index: number = this.quizs.findIndex(q => q.uuid === quiz.uuid);
      if (index !== -1) {
        this.quizs.splice(index, 1);
        this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          resolve();
        }).catch(() => {
          reject();
        });
      }
      else {
        reject();
      }
    });
  }

  //From https://stackoverflow.com/a/2117523
  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
