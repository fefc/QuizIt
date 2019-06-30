import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from 'ionic-angular';
import { HTTP } from '@ionic-native/http';

declare var WifiWizard2: any;

import { Player } from '../../models/player';
import { Game } from '../../models/game';
import { GameState } from '../../models/game';

import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';

import { GameControllerPage } from '../game-controller/game-controller';

@Component({
  selector: 'page-games',
  templateUrl: 'games.html'
})

export class GamesPage {
  private GameState = GameState; //for use in Angluar html
  private games: Array<Game>;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private http: HTTP,
    private profilesProv: UserProfilesProvider) {

    this.games = [];
  }

  doRefresh(refresher) {
    this.games = [];

    WifiWizard2.getWifiIP().then((ip: string) => {
      this.scanNetwork(ip).then((games: Array<Game>) => {
        refresher.complete();
        this.games = games;
      }).catch((error) => {
        refresher.complete();
        this.showGeneralWifiErrorAlert(error);
      });
    }).catch((error) => {
      refresher.complete();
      this.showGeneralWifiErrorAlert('Please make sure your wifi is enabled and connected.');
    });
  }

  scanNetwork(ip: string) {
    return new Promise((resolve, reject) => {
      let promises = [];
      let ipPrefix: string = ip.substr(0, ip.lastIndexOf('.'));
      let newGames: Array<Game> = [];

      for (let i: number = 0; i < 254; i++) {
        promises.push(this.scanIp(ipPrefix + '.' + i));
      }

      Promise.all(promises).then((games: Array<Game>) => {
        for (let game of games) {
          if (game) {
            newGames.push(game);
          }
        }
        resolve(newGames);
      }).catch(() => {
        reject("Could not scan network.");
      });
    });
  }

  scanIp(ip: string) {
    return new Promise((resolve, reject) => {
      this.http.post('http://' + ip + ':8080/searchingQuizPad', {some: "parameter"}, {})
      .then((data) => {
        var game: Game = JSON.parse(data.data);

        if (game.uuid) {
          game.address = ip + ':8080';
          resolve(game);
        } else {
          resolve(undefined);
        }
      }).catch((error) => {
        resolve(undefined);
      });
    });
  }

  joinGame(game: Game, newNickname?: string) {
    let loading = this.loadingCtrl.create({
      content: 'Joining game...'
    });

    loading.present();

    this.resizeAvatar(this.profilesProv.profiles[0].avatar).then((resizedAvatar) => {
      this.http.post('http://' + game.address + '/addPlayer', { nickname: (newNickname ? newNickname : this.profilesProv.profiles[0].nickname), avatar: resizedAvatar }, {})
      .then((data) => {
        let parsedData: any = JSON.parse(data.data);

        if (parsedData.playerUuid) {
          //Player added Successfully
          let player: Player = {
            uuid: parsedData.playerUuid,
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
          if (parsedData.uuid) {
            //But we got information about game state
            if (parsedData.state !== GameState.playersJoining) {
              this.showGeneraljoinGameErrorAlert("The game already started.");
            } else {
              this.showNicknameAlreadyUsedAlert(game);
            }
          } else {
            this.showGeneraljoinGameErrorAlert("General error: Server error.");
          }
        }

        loading.dismiss();
      }).catch((error) => {
        loading.dismiss();
        this.showGeneraljoinGameErrorAlert("General error: Server timeout.");
      });
    }).catch((error) => {
      loading.dismiss();
      this.showGeneraljoinGameErrorAlert("General error: Impossible to resize avatar");
    });
  }

  showNicknameAlreadyUsedAlert(game: Game) {
    let alertMsg = this.alertCtrl.create({
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
    alertMsg.present();
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
    return new Promise((resolve, reject) => {
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
