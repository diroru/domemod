var cleanupOnExit = require('./utils/cleanupOnExit.js');
var paramManager = require('./dmParamManager.js');
var mediaContainer = require('./dmMediaContainer.js');
var glslify = require('glslify');

var canvas = undefined, gl = undefined;

var shaderProgram, vertexPositionAttribute, uSrcTexLoc, uSizeLoc, uShowGridLoc, uSrcTexProjTypeLoc;
var quadVerticesBuffer, quadVerticesIndexBuffer;
var sourceTexture;

//TODO: decide where these should live
var showGrid;

//TODO: bring back some comments!
function init(settings) {
  canvas = document.getElementById(settings.glCanvasId);
  gl = null;
  try {
    gl = canvas.getContext("experimental-webgl", {antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false});
  }
  catch(e) {
    console.error(e);
  }
  console.log('canvas', canvas);
  console.log('gl', gl);
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  } else {
    fitCanvas();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    initShaders();
    initBuffers();
    //init texture(s)
    sourceTexture = gl.createTexture();
    mediaContainer.init(settings);

    //cleanupOnExit takes five params:
    //1: the context
    //2: an array of used textures
    //3: an array of used buffers
    //4: an array of used renderbuffers
    //5: an array of used framebuffers

    //window is global so we don't pass it
    cleanupOnExit(gl, [sourceTexture], [quadVerticesBuffer, quadVerticesIndexBuffer], [], []);
  }
}

function hasInitialized() {
  return (canvas !== undefined && gl !== undefined);
}

//TODO
function draw() {
  if (mediaContainer.newTextureAvailable()) {
    updateTexture();
    // Specify the texture to map onto the faces.

    var unitNo = 0;
    gl.activeTexture(gl.TEXTURE0 + unitNo);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.uniform1i(uSrcTexLoc, unitNo);
    unitNo++;

    if (mediaContainer.getMediaType() === 'image') {
      mediaContainer.setTextureShouldUpdate(false);
    }
  }

  fitCanvas();
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, quadVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  //setting uniforms
  paramManager.getParams().forEach(function(param) {
    switch(param['type']) {
      case 'float':
        switch(param['value'].length) {
          case 1:
            gl.uniform1f(param['uloc'], param['value'][0]);
          break;
          case 2:
            gl.uniform2f(param['uloc'], param['value'][0], param['value'][1]);
          break;
          case 3:
            gl.uniform3f(param['uloc'], param['value'][0], param['value'][1], param['value'][2]);
          break;
        }
        break;
      case 'int':
        switch(param['value'].length) {
          case 1:
            gl.uniform1i(param['uloc'], param['value'][0]);
          break;
          case 2:
            gl.uniform2i(param['uloc'], param['value'][0], param['value'][1]);
          break;
          case 3:
            gl.uniform3i(param['uloc'], param['value'][0], param['value'][1], param['value'][2]);
          break;
        }
        break;
    }
  });


  gl.uniform2f(uSizeLoc, gl.canvas.width, gl.canvas.height);

  gl.uniform1i(uShowGridLoc, showGrid);
  gl.uniform1i(uSrcTexProjTypeLoc, mediaContainer.projectionType);

  // Draw the quad.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadVerticesIndexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // gl.bindTexture(gl.TEXTURE_2D, null);
  window.requestAnimationFrame(draw, canvas);
}

//TODO: make this modular
function updateTexture() {
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, mediaContainer.getMediaElement());
  console.log("media element", mediaContainer.getMediaElement());
  /*for NPOT textures, see as well: https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences*/
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  /*for pot textures*/
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  // gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
  // console.log("media element", mediaElement);
}

function initShaders() {
  /*
  loadFiles(['./glsl/domeviewer.vert', './glsl/domeviewer.frag'], function (shaderText) {
  */
  var shaderText = [];
  shaderText.push(glslify(__dirname + '/../glsl/domemod.vert'));
  shaderText.push(glslify(__dirname + '/../glsl/domemod.frag'));
  // console.log("vertex shader", shaderText[1]);
  // console.log("DEBUG fragment shader ///");
  // console.log(shaderText[1]);
  // console.log("/////////////////////////");
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, shaderText[0]);
  gl.compileShader(vertexShader);

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderText[1]);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader));
    return null;
  }
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader));
    return null;
  }
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);

  //getting uniform locations
  uSrcTexLoc = gl.getUniformLocation(shaderProgram, "uSrcTex");
  uSizeLoc = gl.getUniformLocation(shaderProgram, "uSize");
  uShowGridLoc = gl.getUniformLocation(shaderProgram, "uShowGrid");
  uSrcTexProjTypeLoc = gl.getUniformLocation(shaderProgram, "uSrcTexProjType");
  /*
  domeRadiusULoc = gl.getUniformLocation(shaderProgram, "sphereRadius");
  domePositionULoc = gl.getUniformLocation(shaderProgram, "spherePosition");
  domeOrientationULoc = gl.getUniformLocation(shaderProgram, "sphereOrientation");
  domeLatitudeULoc = gl.getUniformLocation(shaderProgram, "sphereLatitude");
  */
  paramManager.getParams().forEach(function(param) {
    param["uloc"] = gl.getUniformLocation(shaderProgram, param["name"]);
  });
}

function initBuffers() {
  quadVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVerticesBuffer);
  var vertices = [
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  quadVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadVerticesIndexBuffer);
  var quadVertexIndices = [
    0,  1,  2,  0,  2,  3
  ]
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadVertexIndices), gl.STATIC_DRAW);
}

//see:
//http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
//http://stackoverflow.com/questions/11819768/webgl-gl-viewport-change
//http://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html

function fitCanvas() {
  var width = gl.canvas.clientWidth;
  var height = gl.canvas.clientHeight;
  var pr = window.devicePixelRatio;
  //TODO!
  // pr = 1.0;
  if (gl.canvas.width != width || gl.canvas.height != height) {
     gl.canvas.width = width * pr;
     gl.canvas.height = height * pr;
     if (gl) {
         gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
     }
  }
}

module.exports = {
  init : init,
  hasInitialized: hasInitialized,
  draw: draw
}
