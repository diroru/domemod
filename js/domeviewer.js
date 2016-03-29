var glslify = require('glslify');
var cleanupOnExit = require('./utils/cleanupOnExit.js');
// var plyr = require('plyr');

var canvas;
var gl;
var intervalID;

/* textures */
var sourceTexture;

var mediaContainer,
    mediaElement;

var screenWidth, screenHeight, showGrid = 0;

var currentURL;

var srcTexInfo = {
  shouldUpdate : false,
  type: undefined,

  projection_type: 0
};

window.onload = start;


//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {
  console.log("start called");
  // fitCanvas();
  // window.addEventListener('resize', fitCanvas, false);
  screenWidth = screen.width;
  screenHeight = screen.height;
  console.log("screen dimensions: ", screenWidth, "x", screenHeight);
  setupFileHandling();
  canvas = document.getElementById("glcanvas");

  setupParams();
  // loadDefaultImage('./assets/images/Equirectangular_projection_SW.jpg');
  initGUI();
}
