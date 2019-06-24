import { Component } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NavController, NavParams, AlertController, LoadingController, PopoverController } from 'ionic-angular';
import { HTTP } from '@ionic-native/http';

import { Player } from '../../models/player';
import { Game } from '../../models/game';
import { GameState } from '../../models/game';
import { QuestionType } from '../../models/question';

import { GameControllerMenu } from './menu';

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

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private sanitizer:DomSanitizer,
    private http: HTTP,
    params: NavParams) {

    if (params.data) {
      this.game = params.data.game;
      this.player = params.data.player;

      this.gameStateInterval = setInterval(() => {this.checkGameState();}, 300);
    } else {
      this.navCtrl.pop();
    }
  }

  checkGameState() {
    this.http.post('http://' + this.game.address + '/gameState', { uuid: this.player.uuid }, {})
    .then((data) => {
      let parsedData: any = JSON.parse(data.data);

      if (parsedData.state) {
        this.game.state = parsedData.state;

        if (this.game.state === GameState.questionDisplayed) {
          this.game.currentQuestionType = parsedData.type;
        } else {
          this.player.previousPosition = this.player.actualPosition;
          this.player.actualPosition = parsedData.actualPosition;

          this.player.points = (parsedData.points ? parsedData.points : 0);
          this.player.answer = -1;
        }
      } else {
        //alert("sometihng bad happend");
      }
    }).catch((error) => {
      //alert("sometihng bad happend");
    });
  }

  setAnswer(index: number) {
    if (this.player.answer === -1) {
      this.http.post('http://' + this.game.address + '/answer', { uuid: this.player.uuid, answer: index }, {})
      .then((data) => {
        let parsedData: any = JSON.parse(data.data);

        if (parsedData.succes) {
          this.player.answer = index;
        } else {
          //alert("sometihng bad happend");
        }
      }).catch((error) => {
        //alert("sometihng bad happend");
      });
    }
  }

  openMenu(event) {
    let popover = this.popoverCtrl.create(GameControllerMenu);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.navCtrl.pop();
        }
      }
    });
  }

  renderPicture(base64: string) {
    return this.sanitizer.bypassSecurityTrustStyle(`url('${base64}')`);
  }

  /* this will be executed when view is poped, either by exit() or by back button */
  ionViewWillUnload() {
    clearInterval(this.gameStateInterval);
  }
}
