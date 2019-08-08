import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CustomEncoder } from '../../models/custom-encoder'
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/forkJoin'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/map';

declare var WifiWizard2: any;

import { Player } from '../../models/player';
import { Game } from '../../models/game';
import { GameState } from '../../models/game';

import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';

import { GameControllerPage } from '../game-controller/game-controller';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
};

@Component({
  selector: 'page-games',
  templateUrl: 'games.html'
})

export class GamesPage {
  private GameState = GameState; //for use in Angluar html
  private games: Array<Game>;

  private scanning: boolean;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private httpClient: HttpClient,
    private profilesProv: UserProfilesProvider) {

    this.games = [];
    this.scanning = false;
  }

  doRefresh(refresher) {
    this.games = [];
    this.scanning = true;

    WifiWizard2.getWifiIP().then((ip: string) => {
      this.scanNetwork(ip).subscribe((data) => {
        this.games.push(data);
      }, (error) => {
        refresher.complete();
        this.scanning = false;
        this.showGeneralWifiErrorAlert('Could not complete scanning.');
      }, () => {
        refresher.complete();
        this.scanning = false;
      });
    }).catch((error) => {
      refresher.complete();
      this.scanning = false;
      this.showGeneralWifiErrorAlert('Please make sure your wifi is enabled and connected.');
    });
  }

  scanNetwork(ip: string): Observable<Game> {
    return new Observable((observer) => {
      let observables = [];
      let ipPrefix: string = ip.substr(0, ip.lastIndexOf('.'));
      let newGames: Array<Game> = [];

      for (let i: number = 0; i < 254; i++) {
        observables.push(this.scanIp(ipPrefix + '.' + i));
      }

      Observable.forkJoin(observables).subscribe((games: any) => {
        for (let game of games) {
          if (game) {
            observer.next(game);
          }
        }
        observer.complete();
      }, (error) => {
        observer.complete();
      });
    });
  }

  scanIp(ip: string) {
    let httpParams = new HttpParams({encoder: new CustomEncoder()});
    httpParams = httpParams.append("some", "parameter");

    return this.httpClient.post('http://' + ip + ':8080/searchingQuizPad', httpParams, httpOptions)
    .timeout(5000)
    .map((data: any) => {
      if (data.uuid) {
        data.address = ip + ':8080';
        return data;
      } else {
        return Observable.of(undefined);
      }
    })
    .catch((error) => Observable.of(undefined));
  }

  joinGame(game: Game, newNickname?: string) {
    /*let loading = this.loadingCtrl.create({
      content: 'Joining game...'
    });

    loading.present();

    this.resizeAvatar(this.profilesProv.profiles[0].avatar).then((resizedAvatar) => {
      let httpParams = new HttpParams({encoder: new CustomEncoder()});
      httpParams = httpParams.append("nickname", (newNickname ? newNickname : this.profilesProv.profiles[0].nickname));
      httpParams = httpParams.append("avatar", resizedAvatar);

      this.httpClient.post('http://' + game.address + '/addPlayer', httpParams, httpOptions)
      .subscribe((data: any) => {
        if (data.playerUuid) {
          //Player added Successfully
          let player: Player = {
            uuid: data.playerUuid,
            nickname: (newNickname ? newNickname : this.profilesProv.profiles[0].nickname),
            avatar: this.profilesProv.profiles[0].avatar,
            initialPosition: 0,
            actualPosition: 0,
            previousPosition: 0,
            points: 0,
            answer: -1
          };

          this.openGameControllerPage(game, player);
        } else {
          //Player was not added
          if (data.uuid) {
            //But we got information about game state
            if (data.state !== GameState.playersJoining) {
              this.showGeneraljoinGameErrorAlert("The game already started.");
            } else {
              this.showNicknameAlreadyUsedAlert(game);
            }
          } else {
            this.showGeneraljoinGameErrorAlert("General error: Server error.");
          }
        }

        loading.dismiss();
      }, (error) => {
        loading.dismiss();
        this.showGeneraljoinGameErrorAlert("General error: Server timeout.");
      });
    }).catch((error) => {
      loading.dismiss();
      this.showGeneraljoinGameErrorAlert("General error: Impossible to resize avatar");
    });*/
  }

  showNicknameAlreadyUsedAlert(game: Game) {
    /*let alertMsg = this.alertCtrl.create({
      title: 'Nickname already used',
      message: 'Your nickname is already used by someone else, please change it just for now.',
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'nickname',
          placeholder: 'New nickname'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Join',
          handler: data => {
            this.joinGame(game, data.nickname);
          }
        }
      ]
    });
    alertMsg.present();*/
  }

  showGeneraljoinGameErrorAlert(content: string) {
    let message = this.alertCtrl.create({
      title: 'Unable to join quiz',
      message: content,
      buttons: [
        {
          text: 'Close',
          role: 'ok',
        }
      ]
    });

    message.present();
  }

  showGeneralWifiErrorAlert(content: string) {
    let message = this.alertCtrl.create({
      title: 'Could not access wifi',
      message: content,
      buttons: [
        {
          text: 'Close',
          role: 'ok',
        }
      ]
    });

    message.present();
  }

  resizeAvatar(base64Avatar: string) {
    return new Promise<string>((resolve, reject) => {
      //First resize the image
      //The zoom it like avatar displayed
      //https://zocada.com/compress-resize-images-javascript-browser/
      //https://stackoverflow.com/a/28048865/7890583
      let img = new Image();
      img.src = base64Avatar;
      img.onload = (pic: any) => {
        let canvas = document.createElement('canvas');
        let imgRatio: number = img.width / img.height;
        let zoom: number;
        let newImgHeight: number;
        let newImgWidth: number;
        let heightMargin: number = 0;
        let widthMargin: number = 0;

        canvas.width = 200;
        canvas.height = 200;

        if (imgRatio > 1) {
          zoom = img.height / canvas.height;
          newImgHeight = canvas.height;
          newImgWidth = img.width / zoom;
          widthMargin = -(newImgWidth / 2) + (canvas.width / 2);
        } else {
          zoom = img.width / canvas.width;
          newImgHeight = img.height / zoom;
          newImgWidth = canvas.width;
          heightMargin = -(newImgHeight / 2) + (canvas.height / 2);
        }

        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, widthMargin, heightMargin, newImgWidth, newImgHeight);
        resolve(ctx.canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = (error : any) => {
        resolve('');
      }
    });
  }

  openGameControllerPage(game: Game, player: Player) {
    this.navCtrl.push(GameControllerPage, { game: game, player: player });
  }
}
