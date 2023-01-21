const CONSTANTS = {
  DOMSelectors: {
    WAVE_FORM_WRAPPER: ".waveform",
    WAVE_FORM_BCK: ".back-waveform",
    WAVE_FORM_FRONT: ".front-waveform",
    AUDIO_SCRUBBER: ".scrubber",
    DOM_AUDIO_PLAYER: ".dom_audio_player",
    CURRENT_TIME: ".audio_current_time_text",
    DURATION_TIME: ".audio_total_duration",
    AUDIO_PLAYER_PLAY: ".audio_player_play",
    ASIDE: "aside",
    PLAY_ICON: ".play-icon",
    PAUSE_ICON: ".pause-icon",
    PARTICIPANTS_TIMELINE_PROGRESS: ".participant-timeline-progress",
    SEEK_PLUS_10: ".seek_plus_10",
    SEEK_MINUS_10: ".seek_minus_10",
    PLAYBACK_SPEED_CTRL_BTN: ".player-playback-speed",
    PLAYBACK_RATE: ".playback-rate",
    VOLUME_RANGE_SLIDER: ".audio-volume-slider",
    TOGGLE_MUTE_ICON: ".player-volume-ctrl",
    VOLUME_OUT_ICON: ".volume-out",
    VOLUME_MUTED_ICON: ".volume-muted",
  },
  DOM_STRINGS: {
    DOM_AUDIO_PLAYER: "dom_audio_player",
    AUDIO_SCRUBBER: "scrubber",
    HIDE: "hide",
  },
  SEEK_TRANSITION: "all .3s linear",
  SEEK_TRANSITION_0: "all 0s linear",
  URL: "./audio.m4a",
  PLAYBACK_RATES: [0.5, 1.0, 1.25, 1.5, 1.75, 2.0],
};

const utils = (function () {
  function getDOMElements() {
    const { DOMSelectors } = CONSTANTS;
    const DOMElements = {};
    for (let selector in DOMSelectors) {
      DOMElements[selector] = document.querySelector(DOMSelectors[selector]);
    }
    return DOMElements;
  }

  function getClipPointWaveFormFront(percentage) {
    return `polygon(0 0, ${percentage}% 0%, ${percentage}% 100%, 0 100%)`;
  }

  function formatTimeInSSToMMSS(seconds = 0) {
    seconds = Math.ceil(seconds);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds - minutes * 60;
    minutes = minutes > 9 ? minutes : `0${minutes}`;
    seconds = seconds > 9 ? seconds : `0${seconds}`;
    return `${minutes}:${seconds}`;
  }

  return { getDOMElements, getClipPointWaveFormFront, formatTimeInSSToMMSS };
})();

const model = (function () {
  let audioFrequencyData = new Array(300);
  let mouseDownOnScrubber = false;
  let minStickHeight = 5;
  audioFrequencyData = audioFrequencyData.fill(minStickHeight);
  let totalAudioDuration = 0;
  let seekPoint = 0;
  let seekPercentage = 0;
  let isTemporarilyPaused = false;
  let isBuffering = false;
  let currentPlaybackRateIndex = 1;

  return {
    audioFrequencyData,
    mouseDownOnScrubber,
    minStickHeight,
    totalAudioDuration,
    seekPercentage,
    seekPoint,
    isTemporarilyPaused,
    isBuffering,
    currentPlaybackRateIndex,
  };
})();

const view = (function (model) {
  let DOMElements = utils.getDOMElements();

  function initDOMAudioPlayer() {
    const audio = new Audio(CONSTANTS.URL);
    audio.controls = true;
    audio.classList.add(CONSTANTS.DOM_STRINGS.DOM_AUDIO_PLAYER);
    audio.classList.add(CONSTANTS.DOM_STRINGS.HIDE);
    DOMElements.ASIDE.appendChild(audio);
    DOMElements = utils.getDOMElements();
    window.audio = audio;
  }

  function playAudio() {
    DOMElements.PAUSE_ICON.classList.remove(CONSTANTS.DOM_STRINGS.HIDE);
    DOMElements.PLAY_ICON.classList.add(CONSTANTS.DOM_STRINGS.HIDE);
  }

  function pauseAudio() {
    DOMElements.PLAY_ICON.classList.remove(CONSTANTS.DOM_STRINGS.HIDE);
    DOMElements.PAUSE_ICON.classList.add(CONSTANTS.DOM_STRINGS.HIDE);
  }

  function toggleMuteAudioPlayer() {
    DOMElements.VOLUME_OUT_ICON.classList.toggle(CONSTANTS.DOM_STRINGS.HIDE);
    DOMElements.VOLUME_MUTED_ICON.classList.toggle(CONSTANTS.DOM_STRINGS.HIDE);
  }

  function updatePlaybackRate() {
    DOMElements.PLAYBACK_RATE.textContent = `${
      CONSTANTS.PLAYBACK_RATES[model.currentPlaybackRateIndex]
    }X`;
  }

  function updateTotalDurationDOM() {
    DOMElements.DURATION_TIME.textContent = utils.formatTimeInSSToMMSS(
      model.totalAudioDuration
    );
  }

  function updateCurrentAudioTimeDOM(seconds) {
    const isBuffering = model.isBuffering ?? false;
    DOMElements.CURRENT_TIME.textContent = `${utils.formatTimeInSSToMMSS(
      seconds
    )}${isBuffering ? "(Buffering...)" : ""}`;
  }

  function seekWaveFormAndScrubber({
    seekPoint,
    seekPercentage,
    withAnimation = true,
  }) {
    const transition = withAnimation
      ? CONSTANTS.SEEK_TRANSITION
      : CONSTANTS.SEEK_TRANSITION_0;
    DOMElements.WAVE_FORM_FRONT.style.transition = transition;
    DOMElements.AUDIO_SCRUBBER.style.transition = transition;
    DOMElements.WAVE_FORM_FRONT.style.clipPath =
      utils.getClipPointWaveFormFront(seekPercentage);
    DOMElements.AUDIO_SCRUBBER.style.left = `${seekPercentage}%`;
    DOMElements.PARTICIPANTS_TIMELINE_PROGRESS.style.transition = transition;
    DOMElements.PARTICIPANTS_TIMELINE_PROGRESS.style.left = `${seekPercentage}%`;
  }

  function updateScrubberPosition({ forceRenderOnce = false } = {}) {
    if (DOMElements.DOM_AUDIO_PLAYER.paused && !forceRenderOnce) {
      view.pauseAudio();
      return;
    }
    const currentTIme = DOMElements.DOM_AUDIO_PLAYER.currentTime;
    const totalDuration = model.totalAudioDuration;
    const seekPercentage = (currentTIme / totalDuration) * 100;
    updateCurrentAudioTimeDOM(currentTIme);
    seekWaveFormAndScrubber({ seekPercentage, withAnimation: false });
    if (forceRenderOnce) return;
    requestAnimationFrame(updateScrubberPosition);
  }

  return {
    playAudio,
    pauseAudio,
    initDOMAudioPlayer,
    seekWaveFormAndScrubber,
    updateTotalDurationDOM,
    updateScrubberPosition,
    updateCurrentAudioTimeDOM,
    updatePlaybackRate,
    toggleMuteAudioPlayer,
  };
})(model);

const AudioController = (function (model, view) {
  let DOMElements = utils.getDOMElements();

  function init() {
    view.initDOMAudioPlayer();
    DOMElements = utils.getDOMElements();
    DOMElements.DOM_AUDIO_PLAYER.addEventListener(
      "loadedmetadata",
      handleMetaDataLoadedForAudio
    );
    DOMElements.DOM_AUDIO_PLAYER.addEventListener(
      "waiting",
      handleAudioWaiting
    );
    DOMElements.DOM_AUDIO_PLAYER.addEventListener(
      "playing",
      handleAudioResumed
    );
    DOMElements.WAVE_FORM_WRAPPER.addEventListener("click", handleSeek);
    DOMElements.WAVE_FORM_WRAPPER.addEventListener(
      "mousemove",
      handleMouseMoveOnWaveForm
    );
    DOMElements.WAVE_FORM_WRAPPER.addEventListener(
      "mouseup",
      handleMouseUpOnWaveForm
    );
    DOMElements.WAVE_FORM_WRAPPER.addEventListener(
      "mouseleave",
      handleMouseLeaveFromWaveForm
    );
    DOMElements.AUDIO_SCRUBBER.addEventListener(
      "mousedown",
      handleMouseDownOnScrubber
    );
    DOMElements.WAVE_FORM_FRONT.addEventListener(
      "transitionend",
      handleSeekTransitionEnded
    );
    DOMElements.AUDIO_PLAYER_PLAY.addEventListener("click", toggleAudioPlay);
    DOMElements.SEEK_PLUS_10.addEventListener("click", seekPlus10);
    DOMElements.SEEK_MINUS_10.addEventListener("click", seekMinus10);
    DOMElements.PLAYBACK_SPEED_CTRL_BTN.addEventListener(
      "click",
      cyclePlaybackRates
    );
    DOMElements.VOLUME_RANGE_SLIDER.addEventListener(
      "change",
      handleOnVolumeChange
    );
    DOMElements.VOLUME_MUTED_ICON.addEventListener("click", handleToggleMute);
    DOMElements.VOLUME_OUT_ICON.addEventListener("click", handleToggleMute);
  }

  function getCurrentTimeFromSeekPercentage(seekPercentage) {
    const totalDuration = getAudioDuration();
    return (seekPercentage * totalDuration) / 100;
  }

  function handleSeekTransitionEnded() {
    const seekPercentage = model.seekPercentage;
    DOMElements.DOM_AUDIO_PLAYER.currentTime =
      getCurrentTimeFromSeekPercentage(seekPercentage);
    playAudio();
  }

  function handleMetaDataLoadedForAudio() {
    model.totalAudioDuration = getAudioDuration();
    view.updateTotalDurationDOM();
    view.updateCurrentAudioTimeDOM(0);
  }

  function handleAudioWaiting() {
    model.isBuffering = true;
  }

  function handleAudioResumed() {
    model.isBuffering = false;
  }

  function drawFrequencyData(audioFrequencyData) {
    model.audioFrequencyData = audioFrequencyData;
    view.drawFrequencySticks();
  }

  function getSeekPointAndPercentage(event) {
    const { x: startingXCoordinateOfWaveForm, width: waveFormWidth } =
      DOMElements.WAVE_FORM_WRAPPER.getClientRects()[0];
    const xCoordinateOfMouseClick = event.clientX;
    let seekPoint = xCoordinateOfMouseClick - startingXCoordinateOfWaveForm;
    if (seekPoint >= waveFormWidth) seekPoint = waveFormWidth;
    if (seekPoint <= 0) seekPoint = 0;
    const seekPercentage = (seekPoint / waveFormWidth) * 100;
    const seekPosition = { seekPoint, seekPercentage };
    model.seekPercentage = seekPosition.seekPercentage;
    model.seekPoint = seekPosition.seekPoint;
    return seekPosition;
  }

  function handleSeek(event) {
    // if (!event.target.closest(CONSTANTS.DOM_STRINGS.FREQUENCY_STICK_WRAPPER)) return
    if (event.target.classList.contains(CONSTANTS.DOM_STRINGS.AUDIO_SCRUBBER))
      return;
    model.mouseDownOnScrubber = false;
    pauseAudio();
    const { seekPoint, seekPercentage } = getSeekPointAndPercentage(event);
    view.seekWaveFormAndScrubber({
      seekPoint,
      seekPercentage,
      withAnimation: true,
    });
  }

  function handleMouseDownOnScrubber() {
    model.mouseDownOnScrubber = true;
    pauseAudio();
  }

  function handleMouseMoveOnWaveForm(event) {
    if (!model.mouseDownOnScrubber) return;
    const { seekPoint, seekPercentage } = getSeekPointAndPercentage(event);
    const currentTime = getCurrentTimeFromSeekPercentage(seekPercentage);
    DOMElements.DOM_AUDIO_PLAYER.currentTime = currentTime;
    DOMElements.CURRENT_TIME.textContent =
      utils.formatTimeInSSToMMSS(currentTime);
    view.seekWaveFormAndScrubber({
      seekPoint,
      seekPercentage,
      withAnimation: false,
    });
  }

  function handleMouseUpOnWaveForm() {
    if (model.mouseDownOnScrubber && DOMElements.DOM_AUDIO_PLAYER.paused) {
      playAudio();
    }
    model.mouseDownOnScrubber = false;
  }

  function handleMouseLeaveFromWaveForm() {
    if (model.mouseDownOnScrubber && DOMElements.DOM_AUDIO_PLAYER.paused) {
      playAudio();
    }
    model.mouseDownOnScrubber = false;
  }

  function toggleAudioPlay() {
    if (DOMElements.DOM_AUDIO_PLAYER.paused) {
      playAudio();
      return;
    }
    pauseAudio();
  }

  function pauseAudio() {
    DOMElements.DOM_AUDIO_PLAYER.pause();
    view.pauseAudio();
  }

  function playAudio() {
    // if (DOMElements.DOM_AUDIO_PLAYER.currentTime === DOMElements.DOM_AUDIO_PLAYER.duration) {
    //   model.seekPercentage = 0;
    //   view.seekWaveFormAndScrubber({ seekPercentage: 0 })
    //   return
    // }
    DOMElements.DOM_AUDIO_PLAYER.play();
    view.playAudio();
    requestAnimationFrame(view.updateScrubberPosition);
  }

  function seekPlus10() {
    if (
      DOMElements.DOM_AUDIO_PLAYER.currentTime + 10 >=
      model.totalAudioDuration
    ) {
      DOMElements.DOM_AUDIO_PLAYER.currentTime = model.totalAudioDuration;
    } else {
      DOMElements.DOM_AUDIO_PLAYER.currentTime += 10;
    }

    view.updateScrubberPosition({ forceRenderOnce: true });
  }

  function seekMinus10() {
    if (DOMElements.DOM_AUDIO_PLAYER.currentTime - 10 <= 0) {
      DOMElements.DOM_AUDIO_PLAYER.currentTime = 0;
    } else {
      DOMElements.DOM_AUDIO_PLAYER.currentTime -= 10;
    }
    view.updateScrubberPosition({ forceRenderOnce: true });
  }

  function cyclePlaybackRates() {
    const nextPlaybackRateIndex =
      (model.currentPlaybackRateIndex + 1) % CONSTANTS.PLAYBACK_RATES.length;
    DOMElements.DOM_AUDIO_PLAYER.playbackRate =
      CONSTANTS.PLAYBACK_RATES[nextPlaybackRateIndex];
    model.currentPlaybackRateIndex = nextPlaybackRateIndex;
    view.updatePlaybackRate();
  }

  function handleOnVolumeChange(event) {
    event.stopPropagation();
    DOMElements.DOM_AUDIO_PLAYER.volume = event.target.value;
  }

  function handleToggleMute(event) {
    if (
      event.target.tagName !== "ION-ICON" ||
      !event.target.closest("ION-ICON")
    )
      return;
    DOMElements.DOM_AUDIO_PLAYER.muted = !DOMElements.DOM_AUDIO_PLAYER.muted;
    view.toggleMuteAudioPlayer();
  }

  function getAudioDuration() {
    return Math.ceil(DOMElements.DOM_AUDIO_PLAYER.duration);
  }

  return {
    init,
    DOMElements,
    drawFrequencyData,
  };
})(model, view);

AudioController.init();
