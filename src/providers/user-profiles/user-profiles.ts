import * as firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/storage';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription";

import { File } from '@ionic-native/file';
import { DomSanitizer } from '@angular/platform-browser';

import { UserProfile } from '../../models/user-profile';

import { ConnectionProvider } from '../connection/connection';

@Injectable()
export class UserProfilesProvider {
  public profile: UserProfile;

  private profileChangesSubscription: Subscription;

  constructor(
    private file: File,
    private sanitizer:DomSanitizer,
    private connProv: ConnectionProvider) {
    this.profile = {
      uuid: '',
      nickname: '',
      avatar: ''
    };
  }

  connectOnline(profileUuid: string) {
    return new Promise(async (resolve, reject) => {
      if (this.profile.uuid !== profileUuid) {
        try {
          let profileDoc = await firebase.firestore().collection('U').doc(profileUuid).get();
          let profileData = profileDoc.data();

          this.profile = {
            uuid: profileUuid,
            nickname: profileData ? profileData.nickname: '',
            avatar: profileData ? profileData.avatar : '',
          };
        } catch (error) {
          reject(error);
        }
      }

      this.profileChangesSubscription = this.profileChanges().subscribe();
      resolve();
    });
  }

  disconnectOnline() {
    if (this.profileChangesSubscription) this.profileChangesSubscription.unsubscribe();
  }

  createOnline(profile: UserProfile) {
    return this.saveToOnline(profile, true);
  }

  saveToOnline(profile: UserProfile, newProfile?: boolean) {
    return new Promise(async (resolve, reject) => {
      try {
        profile.avatar = await this.uploadAvatar(profile);
      } catch (error) {
        console.log(error);
      }

      let changes = this.getPropertiesChanges(profile);

      if (changes) {
        if (newProfile) {
          firebase.firestore().collection('U').doc(profile.uuid).set(changes);
        } else {
          firebase.firestore().collection('U').doc(profile.uuid).update(changes);
        }
      }

      resolve();
    });
  }

  profileChanges() {
    return new Observable<boolean>(observer => {
      const unsubscribe = firebase.firestore().collection('U').doc(this.profile.uuid).onSnapshot(async (profileDoc) => {
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
              this.profile.avatarUrl = this.sanitizer.bypassSecurityTrustUrl(this.profile.avatar);
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
        }
      });
      return () => {
        unsubscribe();
      };
    });
  }

  getPropertiesChanges(profile: UserProfile) {
    let changes: any = {};

    if (this.profile.uuid === profile.uuid) {
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
