if (!window.TouchEvent) {
  window.TouchEvent = function TouchEvent() {};
}

/**
 *
 * @param scrubberEle
 * @param parentEle
 * @param effectorEle
 * @param handleClickOnParent
 * @param onValueChange
 */
function Scrubber({
  scrubberEle,
  parentEle,
  effectorEle,
  config: { handleClickOnParent = false, onValueChange = () => {} } = {},
} = {}) {
  const CONSTANTS = {
    ERRORS: {
      SCRUBBER_PARENT_AND_EFFECTOR_REQUIRED: new Error(
        "Scrubber, parent and effector elements are required"
      ),
    },
    SEEK_TRANSITION: "all .3s linear",
    SEEK_TRANSITION_0: "all 0s linear",
  };

  const utils = (function utils() {
    function getSeekPointAndPercentage(event, parentElement) {
      if (!parentElement) return;
      const { x: startingXCoordinateOfWaveForm, width: waveFormWidth } =
        parentElement.getClientRects()[0];
      const xCoordinateOfMouseClick =
        event.clientX ?? event.targetTouches?.[0]?.clientX ?? 0;
      let seekPoint = xCoordinateOfMouseClick - startingXCoordinateOfWaveForm;
      if (seekPoint >= waveFormWidth) seekPoint = waveFormWidth;
      if (seekPoint <= 0) seekPoint = 0;
      const seekPercentage = (seekPoint / waveFormWidth) * 100;
      return { seekPoint, seekPercentage };
    }

    return { getSeekPointAndPercentage };
  })();

  const model = (function () {
    let elements = {
      element: null,
      parent: null,
      effector: null,
    };

    let seekPosition = {};

    let mouseDownOnScrubber = false;

    function setMouseDownOnScrubber(value) {
      mouseDownOnScrubber = !!value;
    }

    function getMouseDownOnScrubber() {
      return mouseDownOnScrubber;
    }

    function setElements(scrubber, parent, effector) {
      elements = {
        scrubber,
        parent,
        effector,
      };
    }

    function getElements() {
      return elements;
    }

    function setSeekPosition(seekPoint, seekPercentage) {
      seekPosition = {
        seekPoint,
        seekPercentage,
      };
    }

    function getSeekPosition() {
      return seekPosition;
    }

    return {
      setMouseDownOnScrubber,
      getMouseDownOnScrubber,
      setElements,
      getElements,
      setSeekPosition,
      getSeekPosition,
    };
  })();

  const view = (function (model) {
    function updateScrubberUi({ withAnimation = false } = {}) {
      const { seekPercentage } = model.getSeekPosition();
      const { scrubber, effector } = model.getElements();
      const transition = withAnimation
        ? CONSTANTS.SEEK_TRANSITION
        : CONSTANTS.SEEK_TRANSITION_0;
      scrubber.style.transition = transition;
      effector.style.setProperty("--transition", transition);
      scrubber.style.left = `${seekPercentage}%`;
      scrubber.setAttribute("data-percentage", seekPercentage.toFixed(1) + "%");
      effector.style.setProperty("--dx", `${seekPercentage}%`);
    }

    return { updateScrubberUi };
  })(model);

  const controller = (function controller(model, view) {
    function init(scrubberEle, parentEle, effectorEle) {
      try {
        if (!scrubberEle || !parentEle || !effectorEle)
          throw CONSTANTS.ERRORS.SCRUBBER_PARENT_AND_EFFECTOR_REQUIRED;
        model.setElements(scrubberEle, parentEle, effectorEle);
        scrubberEle.addEventListener("mousedown", handleMouseDownOnScrubber);
        scrubberEle.addEventListener("touchstart", handleMouseDownOnScrubber);
        scrubberEle.addEventListener("mouseup", handleMouseUpOnScrubber);
        scrubberEle.addEventListener("touchend", handleMouseUpOnScrubber);
        parentEle.addEventListener(
          "mousemove",
          handleMouseMoveOnScrubberParent
        );
        parentEle.addEventListener(
          "touchmove",
          handleMouseMoveOnScrubberParent
        );
        parentEle.addEventListener(
          "mouseleave",
          handleMouseLeaveOnScrubberParent
        );
        if (handleClickOnParent)
          parentEle.addEventListener("click", handleClickOnScrubberParent);
      } catch (error) {
        console.error(error);
      }
    }

    function handleMouseDownOnScrubber() {
      try {
        model.setMouseDownOnScrubber(true);
      } catch (error) {
        console.error(error);
      }
    }

    function handleMouseMoveOnScrubberParent(event) {
      try {
        if (!model.getMouseDownOnScrubber()) return;
        if (event instanceof TouchEvent) event.preventDefault();
        requestAnimationFrame(() => {
          const { parent } = model.getElements();
          const { seekPoint, seekPercentage } = utils.getSeekPointAndPercentage(
            event,
            parent
          );
          model.setSeekPosition(seekPoint, seekPercentage);
          view.updateScrubberUi();
          if (typeof onValueChange === "function")
            onValueChange(seekPercentage);
        });
      } catch (error) {
        console.error(error);
      }
    }

    function handleClickOnScrubberParent(event) {
      try {
        requestAnimationFrame(() => {
          const { parent } = model.getElements();
          const { seekPoint, seekPercentage } = utils.getSeekPointAndPercentage(
            event,
            parent
          );
          model.setSeekPosition(seekPoint, seekPercentage);
          view.updateScrubberUi({ withAnimation: true });
          if (typeof onValueChange === "function")
            onValueChange(seekPercentage);
        });
      } catch (error) {
        console.error(error);
      }
    }

    function handleMouseUpOnScrubber() {
      try {
        model.setMouseDownOnScrubber(false);
      } catch (error) {
        console.error(error);
      }
    }

    function handleMouseLeaveOnScrubberParent() {
      try {
        model.setMouseDownOnScrubber(false);
      } catch (error) {
        console.error(error);
      }
    }

    return { init };
  })(model, view);

  controller.init(scrubberEle, parentEle, effectorEle);
}
