(function () {
  const COMMENTS = [
    {
      text: "Good Introduction!!!",
      label: "DK",
      name: "Deep Kunal",
      timeOffsetSec: 8.27,
      id: "cc-1",
    },
    {
      text: "Make sale happen here!!",
      label: "MC",
      name: "Micro center",
      timeOffsetSec: 32.7,
      id: "cc-2",
    },
    {
      text: "This is a test comment.",
      label: "DP",
      name: "Display Picture",
      timeOffsetSec: 43.6,
      id: "cc-3",
    },
    {
      text: "Introduce a new feature here.",
      label: "GH",
      name: "Github",
      timeOffsetSec: 65.4,
      id: "cc-4",
    },
    {
      text: "Point to note...",
      label: "GL",
      name: "Gitlab",
      timeOffsetSec: 87.2,
      id: "cc-5",
    },
  ];
  const state = {
    currentActiveCommentNode: null,
  };
  const DOMElements = utils.getDOMElements();
  let intervalId = null;
  DOMElements.DOM_AUDIO_PLAYER.addEventListener(
    "loadedmetadata",
    constructInAudioComments
  );
  // DOMElements.DOM_AUDIO_PLAYER.addEventListener("play", handleAudioPlay);
  DOMElements.DOM_AUDIO_PLAYER.addEventListener("pause", handleAudioPause);
  DOMElements.DOM_AUDIO_PLAYER.addEventListener("playing", handleAudioPlay);
  DOMElements.DOM_AUDIO_PLAYER.addEventListener("waiting", handleAudioPause);

  function handleAudioPlay() {
    clearInterval(intervalId);
    requestAnimationFrame(checkForProximityAndOpenComment);
    intervalId = setInterval(() => {
      requestAnimationFrame(checkForProximityAndOpenComment);
    }, 1000);
  }

  function handleAudioPause() {
    clearInterval(intervalId);
    intervalId = null;
  }

  function checkForProximityAndOpenComment() {
    // find the close point to currentTime
    // make it active if it falls with in 5s to -2 proximity
    // close the prev point which is active.
    const nearestComment = findNextNearestComment(
      DOMElements.DOM_AUDIO_PLAYER.currentTime
    );
    if (!nearestComment) {
      if (state.currentActiveCommentNode) {
        state.currentActiveCommentNode.classList.remove(
          CONSTANTS.DOM_STRINGS.ACTIVE
        );
      }
      return;
    }
    if (
      state.currentActiveCommentNode &&
      state.currentActiveCommentNode !== nearestComment.node
    ) {
      state.currentActiveCommentNode.classList.remove(
        CONSTANTS.DOM_STRINGS.ACTIVE
      );
    }
    state.currentActiveCommentNode = nearestComment.node;
    state.currentActiveCommentNode.classList.add(CONSTANTS.DOM_STRINGS.ACTIVE);
  }

  function findNextNearestComment(currentTime = 0.0) {
    return COMMENTS.find((comment) => {
      const timeOffsetDiff =
        comment.timeOffsetSec - Number(currentTime.toFixed(2));
      if (timeOffsetDiff <= 5 && timeOffsetDiff > -1) {
        return comment;
      }
    });
  }

  function constructInAudioComments() {
    const totalAudioDuration = Math.ceil(DOMElements.DOM_AUDIO_PLAYER.duration);
    COMMENTS.forEach((comment) => {
      const commentTimelinePercentage =
        (comment.timeOffsetSec / totalAudioDuration) * 100;
      const temp = document.createElement("div");
      temp.innerHTML = `
        <div class="waveform-comment" style="--l: ${commentTimelinePercentage}%">
          <p class="waveform-commenter-label" title="${comment.name}">${comment.label}</p>
          <p class="waveform-comment-text">${comment.text}</p>
        </div>
      `;
      const commentNode = temp.children[0];
      commentNode.setAttribute("id", comment.id);
      commentNode.node = commentNode;
      DOMElements.WAVE_FORM_WRAPPER.appendChild(commentNode);
      comment.node = commentNode;
    });
  }
})();
