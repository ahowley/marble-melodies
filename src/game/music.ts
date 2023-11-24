import * as Tone from "tone";
import { SerializedBody } from "./physics";

export type Notes = "auto" | "A" | "A#" | "B" | "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#";
export type Octaves = "auto" | "A" | "A#" | "B" | "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#";

export class Music {
  marbleSynth: Tone.PolySynth;
  volume: number;

  constructor(marbleSynth: Tone.PolySynth, volume: number) {
    this.marbleSynth = marbleSynth;
    this.volume = volume;
  }

  playPreviewNote() {
    this.marbleSynth.triggerAttack("C4", Tone.now(), 0.5);
    this.marbleSynth.triggerRelease("C4", Tone.now() + 0.1);
  }

  playNote(body: SerializedBody) {
    let note = body.note === "auto" || !body.note ? "C" : body.note;
    let octave = body.octave === "auto" || !body.octave ? "4" : body.octave;
    let volume = body.volume === "auto" || !body.volume ? this.volume : body.volume;
    this.marbleSynth.triggerAttack(`${note}${octave}`, Tone.now(), volume);
    this.marbleSynth.triggerRelease(`${note}${octave}`, Tone.now() + 0.1);
  }
}
