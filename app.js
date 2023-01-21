const waveformEle = document.querySelector(".waveform");
const contextMenuEle = document.querySelector(".context-menu");
const contextMenuBackdropEle = document.querySelector(".context-menu-backdrop");
const newCommentBox = document.querySelector(".live-comment-box");
const addNewCommentBtn = document.querySelector(".add-cmt-btn");
const cancelNewCommentBtn = document.querySelector(".live-comment-cancel");
const exitBtn = document.querySelector(".exit-context-menu");
const liveCommentTime = document.querySelector(".live-comment-time");
const liveCommenterCommentTextarea = document.querySelector(
  ".live-commenter-comment"
);
const liveCommenterStick = document.querySelector(".live-comment-stick");

let audioDurationInSec = 120;
let audioTimeAtClick = 0;
let clickPercentageX = 0;
waveformEle.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const clickX = event.clientX;
  const clickY = event.clientY;
  const waveformRects = waveformEle.getBoundingClientRect();
  clickPercentageX = ((clickX - waveformRects.x) / waveformRects.width) * 100;
  audioTimeAtClick = (audioDurationInSec * clickPercentageX) / 100;
  contextMenuEle.style.top = `${clickY}px`;
  contextMenuEle.style.left = `${clickX}px`;
  contextMenuEle.classList.remove("hide");
  contextMenuBackdropEle.classList.remove("hide");
  document.addEventListener("click", handleClickOutSide);
  document.addEventListener("keydown", handleKeyPress);
  exitBtn.addEventListener("click", hideContextMenu);
  addNewCommentBtn.addEventListener("click", showAddNewCommentSection);
});

function handleClickOutSide(event) {
  event.stopPropagation();
  event.preventDefault();
  if (event.target.closest(".context-menu")) return;
  hideContextMenu();
}

function handleKeyPress(event) {
  if (event.key !== "Escape") return;
  hideContextMenu();
}

function hideContextMenu() {
  contextMenuEle.classList.add("hide");
  contextMenuBackdropEle.classList.add("hide");
  document.removeEventListener("click", handleClickOutSide);
  document.removeEventListener("keypress", handleKeyPress);
  exitBtn.removeEventListener("click", hideContextMenu);
  addNewCommentBtn.removeEventListener("click", showAddNewCommentSection);
}

function showAddNewCommentSection() {
  newCommentBox.classList.remove("hide");
  liveCommenterStick.classList.remove("hide");
  liveCommenterStick.style.left = `calc(${clickPercentageX}% - (var(--live-comment-stick-width) / 2))`;
  liveCommentTime.textContent = getTimeInMinAndSec(audioTimeAtClick);
  liveCommenterCommentTextarea.focus();
  cancelNewCommentBtn.addEventListener("click", hideAddNewCommentSection);
  hideContextMenu();
}

function hideAddNewCommentSection() {
  newCommentBox.classList.add("hide");
  liveCommenterStick.classList.add("hide");
  cancelNewCommentBtn.removeEventListener("click", hideAddNewCommentSection);
}

function getTimeInMinAndSec(sec = 0) {
  let min = Math.floor(sec / 60);
  if (min > 0) {
    sec -= min * 60;
  }
  if (min === 0) {
    min = "00";
  } else if (min < 10) {
    min = `0${min}`;
  }
  sec = Math.floor(sec);
  if (sec === 0) {
    sec = "00";
  } else if (sec < 10) {
    sec = `0${sec}`;
  }
  return `${min}:${sec}`;
}
