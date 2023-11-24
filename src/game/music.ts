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
    this.marbleSynth.triggerAttack("C4", Tone.now(), this.volume);
    this.marbleSynth.triggerRelease("C4", Tone.now() + 0.1);
  }

  playNote(body: SerializedBody) {
    if (body.note === undefined || body.octave === undefined || body.volume === undefined) return;

    let note = body.note === "auto" ? "C" : body.note;
    let octave = body.octave === "auto" ? "4" : body.octave;
    let volume = body.volume * this.volume;
    this.marbleSynth.triggerAttack(`${note}${octave}`, Tone.now(), volume);
    this.marbleSynth.triggerRelease(`${note}${octave}`, Tone.now() + 0.1);
  }
}
