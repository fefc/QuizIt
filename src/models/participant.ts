enum Role {
  Administrator = 0,
  Editor = 1,
  Player = 2,
  Speeker = 3
}

export interface Participant {
  deviceId: number,
  nickname: string,
  avatar: string,
  role: Role
}
