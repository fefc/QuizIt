import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';

import { Quiz } from '../../models/quiz';

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
      // strangly if id = 0 !quiz.id will be true even if 0 has been set!
      //if (!quiz.id || quiz.id === -1) {
      if (quiz.id === -1) {
        //We have a new quiz, so first we need to get a new id
        let newQuiz: Quiz = {
          id: this.quizs.length,
          title: quiz.title,
          creationDate: quiz.creationDate,
          categorys: quiz.categorys
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
        if (this.quizs.findIndex(quiz => quiz.id === quiz.id) !== -1) {
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
        let index = this.quizs.findIndex(quiz => quiz.id === selectedQuiz.id);
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
      let index: number = this.quizs.findIndex(quiz => quiz.id === quiz.id);
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
}
