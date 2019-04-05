export namespace BuzzersConstants {
    export const KEYSETS: Array<Buzzer> =  [{uuid: "0", keys: ["a", "b", "c", "d", "e"]},
                                            {uuid: "1", keys: ["f", "g", "h", "i", "j"]},
                                            {uuid: "2", keys: ["k", "l", "m", "n", "o"]},
                                            {uuid: "3", keys: ["p", "q", "r", "s", "t"]},
                                            {uuid: "4", keys: ["u", "v", "w", "x", "y"]},
                                            {uuid: "5", keys: ["0", "1", "2", "3", "4"]},
                                            {uuid: "6", keys: ["5", "6", "7", "8", "9"]},
                                            {uuid: "7", keys: [",", ".", "/", "\\", "-"]}]; // the last key is the buzzer for pictures
}

export interface Buzzer {
  uuid: string,
  keys: Array<string>,
}
