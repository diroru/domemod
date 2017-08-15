var glslify = require('glslify');
var glManager = require('./dmGLManager.js');
var mediaContainer = require('./dmMediaContainer.js');
var UIManager = require('./dmUIManager.js');
var inputManager = require('./dmInputManager.js');

window.onload = start;

var settings = {
  glCanvasId : "dm-gl-canvas",
  vsPath: '/../glsl/domemod.vert',
  fsPath: '/../glsl/domemod.frag',
  mediaContainerId: "media-container",
  videoFileFieldId: "the-video-file-field",
  youtubeVideoSumbitId: "the-youtube-video-submit",
  uiId: 'ui'
}

function start() {
  console.log("start called");
  // fitCanvas();
  // window.addEventListener('resize', fitCanvas, false);
  screenWidth = screen.width;
  screenHeight = screen.height;
  console.log("screen dimensions: ", screenWidth, "x", screenHeight);

  glManager.init(settings);
  if (glManager.hasInitialized()) {
    UIManager.init(settings);
    inputManager.init(settings);
    glManager.draw();
    mediaContainer.setImageSource('./assets/images/World_Equirectangular.jpg');
  } else {
    alert("something has gone terribly wrong");
  }
}
