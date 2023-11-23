import * as Tone from "tone";
import { SerializedBody } from "./physics";

export class Music {
  marbleSynth: Tone.PolySynth;

  constructor(marbleSynth: Tone.PolySynth) {
    this.marbleSynth = marbleSynth;
  }

  playNote(body: SerializedBody | null = null) {
    this.marbleSynth.triggerAttack("C4", Tone.now());
    this.marbleSynth.triggerRelease("C4", Tone.now() + 0.1);
  }
}
