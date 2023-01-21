const backWaveform = document.querySelector("div.back-waveform");
const fwdWaveform = document.querySelector("div.front-waveform");
const backWaveformEls = [];
const frontWaveformEls = [];
const WAVEFORM_STICKS_COUNT = 300;

for (let i = 0; i < WAVEFORM_STICKS_COUNT; i++) {
  const bckDiv = document.createElement("div");
  const fwdDiv = document.createElement("div");
  backWaveform.appendChild(bckDiv);
  fwdWaveform.appendChild(fwdDiv);
  backWaveformEls.push(bckDiv);
  frontWaveformEls.push(fwdDiv);
}

// for (let i = 0; i < WAVEFORM_STICKS_COUNT; i++) {
//   const height = Math.random() * 90 + 7;
//   backWaveformEls[i].style.setProperty("height", `${height}%`);
//   frontWaveformEls[i].style.setProperty("height", `${height}%`);
// }

window.Scrubber({
  scrubberEle: document.querySelector("div.scrubber"),
  parentEle: document.querySelector("div.waveform"),
  effectorEle: document.querySelector("div.front-waveform"),
  config: { handleClickOnParent: true },
});

// const url = "./audio.m4a";
const url = "./audio.m4a";

let wavesurfer = window.WaveSurfer.create({
  container: ".wave_surfer",
});

wavesurfer.load(url);

wavesurfer.on("ready", function () {
  wavesurfer.exportPCM(WAVEFORM_STICKS_COUNT / 2, 100000, true).then((PCM) => {
    PCM = PCM.map((f, i) => {
      return Number(Math.abs(f).toString().split(".")[1]);
    }).filter((f) => f !== false);
    let min = PCM[0];
    let max = PCM[0];
    for (let i = 1; i < PCM.length; i++) {
      if (PCM[i] > max) {
        max = PCM[i];
      }
      if (PCM[i] < min) {
        min = PCM[i];
      }
    }
    PCM = PCM.map((f) => {
      return (90 - 5) * ((f - min) / (max - min)) + 5;
    });
    for (let i = 0; i < WAVEFORM_STICKS_COUNT; i++) {
      const height = PCM[i];
      backWaveformEls[i].style.setProperty("height", `${height}%`);
      frontWaveformEls[i].style.setProperty("height", `${height}%`);
    }
  });
});
