import * as firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/functions';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription";
import { Subject } from 'rxjs/Subject';

import { Game, GameState } from '../../models/game';
import { Player } from '../../models/player';

@Injectable()
export class GameProvider {
  public game: Game;
  public players: Array<Player>;
  public currentPicture: number;

  public allPlayersAnswered: Subject<boolean>;
  public allPlayersAnswered$: Observable<boolean>; //Has a $

  private playersChangesSubscription: Subscription;

  constructor() {
    this.game = undefined;
    this.players = undefined;

    this.allPlayersAnswered = new Subject<boolean>();
    this.allPlayersAnswered$ = this.allPlayersAnswered.asObservable();
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

        this.playersChangesSubscription = this.playerAnswerChanges().subscribe((data) => {
          if ((data.answer >= 0 && data.answer <= 3) || data.answer === 100) {
            let player: Player = this.players.find((p) => p.uuid === data.uuid);

            if (player) {
              if (player.answer === -1) {
                if (data.answer === 100) {
                  player.answer = this.currentPicture;
                } else {
                  player.answer = data.answer;
                }

                //check if all player answered the curren question, if so send an event
                if (!this.players.some((x) => x.answer === -1)) {
                    this.allPlayersAnswered.next(true);
                }
              }
            }
          }
        });
      } else {
        this.playersChangesSubscription.unsubscribe();
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
      this.playersChangesSubscription.unsubscribe();

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
      const unsubscribe = firebase.firestore().collection('G').doc(this.game.uuid).collection('P').onSnapshot(querySnapshot => {
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

      return () => {
        unsubscribe();
      };
    });
  }

  playerAnswerChanges() {
    return new Observable<any>(observer => {
      const unsubscribe = firebase.firestore().collection('G').doc(this.game.uuid).collection('P').onSnapshot(querySnapshot => {
        querySnapshot.docChanges().forEach(change => {
          if (change.type === 'modified') {
            observer.next({uuid: change.doc.id, answer: change.doc.data().I});
          }
        });
      });

      return () => {
        unsubscribe();
      };
    });
  }

  deletePlayer(index: number) {
    return new Promise<string>((resolve, reject) => {
      firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(this.players[index].uuid).collection('L').doc('S').update({R: -1}).then(data => {
          this.players.splice(index, 1);

          for(let i = index; i < this.players.length; i++) {
            this.players[i].animations.initialPosition = i;
            this.players[i].animations.actualPosition = i;
            this.players[i].animations.previousPosition = i;
          }

        resolve();
      }).catch(error => {
        reject("Could not delete player online");
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

        realPlayer.stats.position = realPlayer.animations.actualPosition + 1;
      }

      let batch = firebase.firestore().batch();

      for (let player of this.players) {
        let playerRef = firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(player.uuid).collection('L').doc('S');
        batch.update(playerRef, {R: player.stats.position, P: player.stats.points});

        //Update answer Index to -1 so that it will generate an event next time user clicks on same button
        let answerRef = firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(player.uuid);
        batch.update(answerRef, {I: -1});
      }

      // Commit the batch
      return batch.commit().then(() => {
        resolve();
      }).catch(() => {
        reject("Could not update players online");
      });
    });
  }
}
