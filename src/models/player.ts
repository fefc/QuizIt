export interface Player {
  readonly uuid: string,
  readonly nickname: string,
  readonly avatar: string,
  answer: number,
  stats: PlayerStats,
  animations?: PlayerAnimData
}

export interface PlayerStats {
  position: number,
  points: number
}

export interface PlayerAnimData {
  initialPosition: number,
  actualPosition: number,
  previousPosition: number,
}
