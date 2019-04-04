export interface Player {
  readonly uuid: string,
  readonly nickname: string,
  readonly avatar: string,
  initialPosition: number,
  actualPosition: number,
  previousPosition: number,
  points?: number,
  answer: number,
}
