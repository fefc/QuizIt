import * as firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/functions';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription";

import { Game, GameState } from '../../models/game';
import { Player, PlayerStats } from '../../models/player';

@Injectable()
export class GameControllerProvider {
  public game: Game;
  public player: Player;

  private gameStateChangesSubscription: Subscription;
  private playerStatsChangesSubscription: Subscription;

  constructor() {
    this.game = undefined;
    this.player = undefined;
  }

  joinGame(gameID: string, nickname: string, avatar: string) {
    return new Promise((resolve, reject) => {
      const joinGameFirebase = firebase.functions().httpsCallable('joinGame');

      joinGameFirebase({G: gameID, P: {N: nickname, A: avatar}}).then(result => {
        if (result.data.uuid) {
          //We got a player id from firebase, good to go
          this.game = {
            uuid: gameID,
            state : GameState.playersJoining
          }

          this.player = {
            uuid: result.data.uuid,
            nickname: nickname,
            avatar: avatar,
            answer: -1,
            stats: {
              position: 0,
              points: 0
            }
          }

          this.gameStateChangesSubscription = this.gameStateChanges().subscribe((gameState) => {
            //When game state changes we can also reset answers
            this.player.answer = -1;
            this.game.state = gameState;

            if (gameState === GameState.ended) {
              this.leaveGame().then(() => {

              });
            }
          }, (error) => {
            console.log(error);
          });

          this.playerStatsChangesSubscription = this.playerStatsChanges().subscribe((playerStats) => {
            if (playerStats.position === -1) {
              this.leaveGame().then(() => {
                this.game.state = GameState.quickedOut;
              });
            } else {
              this.player.stats = playerStats;
            }
          }, (error) => {
            console.log(error);
          });

          resolve();
        } else {
          reject();
        }
      }).catch(error => {
        reject("Unable to create game online.");
      });
    });
  }

  leaveGame() {
    return new Promise((resolve, reject) => {
      if (this.game.uuid) {
        this.gameStateChangesSubscription.unsubscribe();
        this.playerStatsChangesSubscription.unsubscribe();
      }

      resolve();
    });
  }

  setPlayerAnswer(answerIndex: number) {
    return new Promise((resolve, reject) => {
      firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(this.player.uuid).update({I: answerIndex}).then(() => {
        this.player.answer = answerIndex;
        resolve();
      }).catch(error => {
        reject("Unable to set player answer online.");
      });
    });
  }

  gameStateChanges() {
    return new Observable<GameState>(observer => {
      firebase.firestore().collection('G').doc(this.game.uuid).onSnapshot(docSnapshot => {
        if (docSnapshot.exists) {
          observer.next(docSnapshot.data().S);
        } else {
          observer.next(GameState.ended);
        }
      });

      return () => {
        let unsub = firebase.firestore().collection('G').doc(this.game.uuid).onSnapshot(() => {});
        unsub();
      };
    });
  }

  playerStatsChanges() {
    return new Observable<PlayerStats>(observer => {
      firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(this.player.uuid).collection('L').doc('S').onSnapshot(docSnapshot => {
        if (docSnapshot.exists) {
          observer.next({
            position: docSnapshot.data().R,
            points: docSnapshot.data().P
          });
        } else {
          //Player has been deleted
          observer.next({
            position: -1,
            points: -1
          });
        }
      });

      return () => {
        let unsub = firebase.firestore().collection('G').doc(this.game.uuid).collection('P').doc(this.player.uuid).collection('L').doc('S').onSnapshot(() => {});
        unsub();
      };
    });
  }
}
