enum Role {
  Administrator = 0,
  Editor = 1,
  Player = 2,
  Speeker = 3
}

export interface Player {
  deviceId: number,
  nickname: string,
  avatar: string,
  readonly initialPosition: number,
  actualPosition: number,
  previousPosition: number,
  points?: number,
  answer?: number,
}
