export interface Player {
  readonly uuid: string,
  readonly nickname: string,
  readonly avatar: string,
  readonly initialPosition: number,
  actualPosition: number,
  previousPosition: number,
  points?: number,
  answer: number,
}
