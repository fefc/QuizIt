import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavController, NavParams, AlertController, LoadingController, PopoverController } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CustomEncoder } from '../../models/custom-encoder'
import 'rxjs/add/operator/timeout';

import { Player } from '../../models/player';
import { Game } from '../../models/game';
import { GameState } from '../../models/game';
import { QuestionType } from '../../models/question';

import { GameControllerMenu } from './menu';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
};

@Component({
  selector: 'page-game-controller',
  templateUrl: 'game-controller.html'
})

export class GameControllerPage {
  private GameState = GameState; //for use in Angluar html
  private QuestionType = QuestionType; //for use in Angular html

  private player: Player;
  private game: Game;

  private gameStateInterval: any;

  private gameStateErrorCounter: number;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private sanitizer:DomSanitizer,
    private httpClient: HttpClient,
    params: NavParams) {

    if (params.data) {
      this.game = params.data.game;
      this.player = params.data.player;

      this.gameStateErrorCounter = 0;
      this.gameStateInterval = setInterval(() => {this.checkGameState();}, 300);
    } else {
      this.exit();
    }
  }

  checkGameState() {
    let httpParams = new HttpParams({encoder: new CustomEncoder()});
    httpParams = httpParams.append("uuid", this.player.uuid);

    this.httpClient.post('http://' + this.game.address + '/gameState', httpParams, httpOptions).timeout(250) //needs to be smaller than checkInterval
    .subscribe((data: any) => {
      if (data.state) {
        this.gameStateErrorCounter = 0;

        this.game.state = data.state;

        if (this.game.state === GameState.questionDisplayed) {
          this.game.currentQuestionType = data.type;
        } else {
          this.player.previousPosition = this.player.actualPosition;
          this.player.actualPosition = data.actualPosition;

          this.player.points = (data.points ? data.points : 0);
          this.player.answer = -1;

          if (this.game.state === GameState.ended) {
            clearInterval(this.gameStateInterval);
          }
        }
      } else {
        this.handleGameStateError();
      }
    }, (error) => {
      this.handleGameStateError();
    });
  }

  handleGameStateError() {
    if (this.gameStateErrorCounter <= 20) {
      this.gameStateErrorCounter += 1;
    } else if (this.gameStateErrorCounter === 21) {
      this.game.state = GameState.connectionLost;
      clearInterval(this.gameStateInterval);

      let message = this.alertCtrl.create({
        title: 'Lost connection',
        message: "I'm unable to reach quiz host, do you want to retry?",
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: data => {
              this.game.state = GameState.ended;
            }
          },
          {
            text: 'Yes',
            handler: data => {
              this.gameStateErrorCounter = 0;
              this.gameStateInterval = setInterval(() => {this.checkGameState();}, 300);
            }
          }
        ]
      });

      message.present();
    }
  }

  setAnswer(index: number) {
    if (this.player.answer === -1) {
      let httpParams = new HttpParams({encoder: new CustomEncoder()});
      httpParams = httpParams.append("uuid", this.player.uuid);
      httpParams = httpParams.append("answer", index.toString());

      this.httpClient.post('http://' + this.game.address + '/answer', httpParams, httpOptions)
      .subscribe((data: any) => {
        if (data.success) {
          this.player.answer = index;
        } else {
          this.showSetAnswerErrorAlert();
        }
      }, (error) => {
        this.showSetAnswerErrorAlert();
      });
    }
  }

  openMenu(event) {
    let popover = this.popoverCtrl.create(GameControllerMenu);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.exit();
        }
      }
    });
  }

  showSetAnswerErrorAlert() {
    let message = this.alertCtrl.create({
      title: 'Could no set answer',
      message: 'Please try again',
      buttons: [
        {
          text: 'Close',
          role: 'ok',
        }
      ]
    });

    message.present();
  }

  renderPicture(base64: string) {
    return this.sanitizer.bypassSecurityTrustStyle(`url('${base64}')`);
  }

  exit() {
    this.navCtrl.pop();
  }

  /* this will be executed when view is poped, either by exit() or by back button */
  ionViewWillUnload() {
    clearInterval(this.gameStateInterval);
  }
}
