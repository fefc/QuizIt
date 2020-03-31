import * as firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/storage';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription";

import { UserProfile } from '../../models/user-profile';

import { ConnectionProvider } from '../connection/connection';

@Injectable()
export class UserProfilesProvider {
  public profile: UserProfile;

  private profileChangesSubscription: Subscription;

  constructor(
    private connProv: ConnectionProvider) {
    this.profile = {
      uuid: '',
      nickname: '',
      avatar: ''
    };
  }

  sync(profileUuid: string) {
    return new Promise(async (resolve, reject) => {
      this.stopSync();

      if (this.profile.uuid !== profileUuid) {
        try {
          let profileDoc = await firebase.firestore().collection('U').doc(profileUuid).get();
          let profileData = profileDoc.exists ? profileDoc.data() : undefined;

          this.profile = {
            uuid: profileUuid,
            nickname: profileData ? profileData.nickname : '',
            avatar: profileData ? profileData.avatar : '',
            avatarUrl: undefined //intentional, if nickname = '' this will shot the create profile without avatar
          };

        } catch (error) {
          reject(error);
        }
      }

      this.profileChangesSubscription = this.profileChanges().subscribe();
      resolve();
    });
  }

  stopSync() {
    if (this.profileChangesSubscription) this.profileChangesSubscription.unsubscribe();
  }

  saveToOnline(profile: UserProfile) {
    return new Promise(async (resolve, reject) => {
      try {
        profile.avatar = await this.uploadAvatar(profile);
      } catch (error) {
        console.log(error);
      }

      let changes = this.getPropertiesChanges(profile);

      if (changes) {
        firebase.firestore().collection('U').doc(profile.uuid).get().then((doc) => {
          if (doc.exists) {
            firebase.firestore().collection('U').doc(profile.uuid).update(changes);
          } else {
            firebase.firestore().collection('U').doc(profile.uuid).set(changes);
          }
          resolve();
        }).catch((error) => {
          reject();
        });
      } else {
        resolve();
      }
    });
  }

  profileChanges() {
    return new Observable<boolean>(observer => {
      const unsubscribe = firebase.firestore().collection('U').doc(this.profile.uuid).onSnapshot(async (profileDoc) => {
        if (profileDoc.exists) {
          let profileData = profileDoc.data();
          let pendingUpload:boolean = false;

          this.profile.avatar = profileData.avatar;
          this.profile.nickname = profileData.nickname;

          if (this.profile.avatar) {
            try {
               pendingUpload = await this.connProv.checkPendingUpload(this.profile.avatar);

              if (pendingUpload) {
                await this.saveToOnline(JSON.parse(JSON.stringify(this.profile)));
              }
            } catch (error) {
              console.log(error);
            }

            if (['file:///', 'filesystem:'].some(extension => this.profile.avatar.startsWith(extension))) {
              if (pendingUpload) {
                this.profile.avatarUrl = await this.connProv.getLocalFileUrl(this.profile.avatar);
              } else {
                this.profile.avatarUrl = undefined;
              }
            } else {
              this.getAvatar(this.profile).then((url) => {
                this.profile.avatarUrl = url;
              }).catch((error) => {
                this.profile.avatarUrl = undefined;
             });
            }
          } else {
            this.profile.avatarUrl = undefined;
          }
        } else {
          this.profile.avatar = '';
          this.profile.nickname = '';
          this.profile.avatarUrl = undefined;
        }
      });
      return () => {
        unsubscribe();
      };
    });
  }

  getPropertiesChanges(profile: UserProfile) {
    let changes: any = {};

    if (this.profile.nickname !== '') {
      //An update on a category
      if (profile.nickname !== this.profile.nickname) changes.nickname = profile.nickname;
      if (profile.avatar !== this.profile.avatar) changes.avatar = profile.avatar;
    } else {
      //A creation of a category
      changes.nickname = profile.nickname;
      changes.avatar = profile.avatar;
    }

    if (Object.keys(changes).length === 0) return undefined;
    else return changes;
  }

  uploadAvatar(profile: UserProfile) {
    return new Promise<string>((resolve, reject) => {
      if (['file:///', 'filesystem:'].some(extension => profile.avatar.startsWith(extension))) {
        this.connProv.uploadFileOnline('U/' + profile.uuid + '/', profile.avatar).then((fileName) => {
          resolve(fileName);
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject('Nothing to upload.');
      }
    });
  }

  getAvatar(profile: UserProfile) {
    return this.connProv.getStorageUrl('U/' + profile.uuid + '/' + profile.avatar);
  }
}
