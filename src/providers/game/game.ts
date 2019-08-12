import * as firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/functions';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription";

import { Game, GameState } from '../../models/game';
import { Player } from '../../models/player';

@Injectable()
export class GameProvider {
  public game: Game;
  public players: Array<Player>;

  private playersChangesSubscription: Subscription;

  constructor() {
    this.game = undefined;
    this.players = undefined;
  }

  createGame() {
    return new Promise<string>((resolve, reject) => {
      firebase.firestore().collection('G').add({S: GameState.playersJoining, T: firebase.firestore.FieldValue.serverTimestamp()}).then(data => {

        this.game = {
          uuid: data.id,
          state: GameState.playersJoining
        };

        this.players = [];

        this.playersChangesSubscription = this.playerAddedChanges().subscribe((newPlayer) => {

          newPlayer.animations = {
            initialPosition: this.players.length,
            previousPosition: this.players.length,
            actualPosition: this.players.length,
          };

          newPlayer.answer = -1;

          newPlayer.stats = {
            position: this.players.length,
            points: 0
          };

          this.players.push(newPlayer);
        }, (error) => {
          console.log(error);
        });

        resolve();
      }).catch(error => {
        reject("Could not create game online");
      });
    });
  }

  startGame() {
    return new Promise<string>((resolve, reject) => {
      firebase.firestore().collection('G').doc(this.game.uuid).update({S: GameState.loading, T: firebase.firestore.FieldValue.serverTimestamp()}).then(data => {
        this.playersChangesSubscription.unsubscribe();

        for (let player of this.players) {
          player.stats.position = player.animations.actualPosition + 1;
          player.stats.points = 0;
        }

        this.playersChangesSubscription = this.playerAnswerChanges().subscribe((data) => {
          let player: Player = this.players.find((p) => p.uuid === data.uuid);
          player.answer = data.answer;
        });

        this.updateState(GameState.loading).then(() => {
          resolve();
        }).catch((error) => {
          reject("Could not create game online");
        });
      }, (error) => {
        reject("Could not create game online");
      });
    });
  }

  updateState(gameState: GameState) {
    return new Promise<string>((resolve, reject) => {
      if (gameState === GameState.pictureQuestionDisplayed || gameState === GameState.classicQuestionDisplayed) {
        for (let player of this.players) {
          player.answer = -1;
        }
      }

      firebase.firestore().collection('G').doc(this.game.uuid).update({S: gameState, T: firebase.firestore.FieldValue.serverTimestamp()}).then(data => {
        this.game.state = gameState;
        resolve();
      }).catch(error => {
        reject("Could not update game online");
      });
    });
  }

  deleteGame() {
    return new Promise<string>((resolve, reject) => {
      const deleteGameFirebase = firebase.functions().httpsCallable('deleteGame');

      deleteGameFirebase({P: this.game.uuid}).then(result => {
        if (result.data.deleted) {
          resolve();
        } else {
          reject();
        }
      }).catch(error => {
        reject("Unable to delete game online.");
      });
    });
  }

  playerAddedChanges() {
    return new Observable<Player>(observer => {
      firebase.firestore().collection('G').doc(this.game.uuid).collection('P').onSnapshot(querySnapshot => {
        querySnapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            let player: Player = {
              uuid: change.doc.id,
              nickname: change.doc.data().N,
              avatar: change.doc.data().A,
              answer: -1,
              stats: {
                position: 0,
                points: 0
              }
            };
            observer.next(player);
          }
        });
      });
    });
  }

  playerAnswerChanges() {
    return new Observable<any>(observer => {
      firebase.firestore().collection('G').doc(this.game.uuid).collection('P').onSnapshot(querySnapshot => {
        querySnapshot.docChanges().forEach(change => {
          if (change.type === 'modified') {
            observer.next({uuid: change.doc.id, answer: change.doc.data().I});
          }
        });
      });
    });
  }

  deletePlayer(index: number) {
    return new Promise<string>((resolve, reject) => {
      firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(this.players[index].uuid).delete().then(data => {
          this.players.splice(index, 1);

          for(let i = index; i < this.players.length; i++) {
            this.players[i].animations.initialPosition = i;
            this.players[i].animations.actualPosition = i;
            this.players[i].animations.previousPosition = i;
          }

        resolve();
      }).catch(error => {
        reject("Could not delete game online");
      });
    });
  }

  updatePlayersPointsAndPosition(rightAnswer: number) {
    return new Promise<string>((resolve, reject) => {
      for (var player of this.players) {
        if (player.answer === rightAnswer) {
          player.stats.points += 100; //TODO set settings
        }
      }

      //JSON usefull to make a quick and dirty depp copy
      let sortedPlayers = JSON.parse(JSON.stringify(this.players)).sort((pOne, pTwo) => {
        return pTwo.stats.points - pOne.stats.points;
      });;

      for (let newPlayerPosition = 0; newPlayerPosition < sortedPlayers.length; newPlayerPosition++) {
        let realPlayer = this.players.find((player) => player.uuid === sortedPlayers[newPlayerPosition].uuid);
        realPlayer.animations.previousPosition = realPlayer.animations.actualPosition;
        realPlayer.animations.actualPosition = newPlayerPosition;
      }

      let batch = firebase.firestore().batch();

      for (let player of this.players) {
        let playerRef = firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(player.uuid).collection('L').doc('S');
        batch.update(playerRef, {R: player.stats.position, P: player.stats.points});
      }

      // Commit the batch
      return batch.commit().then(() => {
        resolve();
      }).catch(() => {
        reject("Could not update players online");
      });
    });
  }

  /*joinGame(gameID: string, nickname: string, avatar: string) {
    return new Promise<string>((resolve, reject) => {
      const joinGameFirebase = firebase.functions().httpsCallable('joinGame');

      joinGameFirebase({G: gameID, P: {N: nickname, A: avatar}}).then(data => {

        this.game = {
          uuid: gameID,
          state: GameState.playersJoining
        };

        this.player = {
          uuid: data.data.uuid,
          nickname: nickname,
          avatar: avatar
        };

        //this.player

        resolve();
      }).catch(error => {
        console.log(error);
        reject("Could not add player online");
      });
    });
  }*/

  /*playerChanges() {
    return new Observable(observer => {
      firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(this.player.uuid).onSnapshot(docSnapshot => {
        if (docSnapshot.exists) {
          console.log("Player has been updated");
        } else {
          console.log("Player deleted");
        }
        console.log(docSnapshot);
        observer.next("toto");*/
        /*querySnapshot.docChanges().forEach(change => {
          /*if (change.type === 'added') {
            let player: Player = {
              uuid: change.doc.id,
              nickname: change.doc.data().N,
              avatar: change.doc.data().A
            };
            observer.next(player);
          }*/
          /*if (change.type === 'modified') {
            console.log('Modified city: ', change.doc.data());
          }*/
          /*if (change.type === 'removed') {
            console.log(change.doc.id);
            console.log('Removed city: ', change.doc.data());
            observer.next("toto");
          }
        });*/

      /*});
    });
  }*/
}
