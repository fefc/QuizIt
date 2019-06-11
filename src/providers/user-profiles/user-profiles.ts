import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';

import { UserProfile } from '../../models/user-profile';

@Injectable()
export class UserProfilesProvider {
  public profiles: Array<UserProfile>;

  constructor(private storage: Storage) {
    this.profiles = new Array<UserProfile>();
  }

  loadFromStorage() {
    return new Promise((resolve, reject) => {
      this.storage.keys().then(keys => {
        if (keys.indexOf('profiles') > -1) {
          this.storage.get('profiles').then(data => {
            if (data) {
              this.profiles = JSON.parse(data);
              resolve();
            }
          }).catch(() => {
            reject();
          });
        } else {
          resolve();
        }
      }).catch(() => {
        reject();
      });

    });
  }

  saveToStorage(profile: UserProfile) {
    return new Promise((resolve, reject) => {
      if (!profile.uuid) {
        //We have a new profile, so first we need to get a new uuid
        let uuid: string = this.uuidv4();

        while (this.profiles.findIndex((p) => p.uuid === uuid) !== -1) {
          uuid = this.uuidv4();
        }

        let newProfile: UserProfile = {
          uuid: uuid,
          nickname: profile.nickname,
          avatar: profile.avatar
        }

        if(this.profiles.length > 0) {
          this.profiles[0] = newProfile;
        } else {
          this.profiles.push(newProfile);
        }

        this.storage.set('profiles', JSON.stringify(this.profiles)).then(() => {
          profile = this.profiles[this.profiles.length - 1];
          resolve(newProfile);
        }).catch(() => {
          reject('Could not save user profile to storage.');
        });
      }
      else {
        //Saving an exsisting profile, lets just make sure it's in the list
        let profileIndex: number = this.profiles.findIndex((p) => p.uuid === profile.uuid);
        if (profileIndex !== -1) {
          this.storage.set('profiles', JSON.stringify(this.profiles)).then(() => {
            resolve();
          }).catch(() => {
            reject('Could not save user profile to storage.');
          });
        }
        else {
          reject('Could not find user profile.');
        }
      }
    });
  }

  //From https://stackoverflow.com/a/2117523
  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
