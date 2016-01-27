var canvas;
var gl;
var intervalID;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;

/* textures */
var sourceTexture;

var shaderProgram;
//attribute locations
var vertexPositionAttribute;
var textureCoordAttribute;
//uniform locations
var sizeULoc,
    srcTexULoc,
    domeRadiusULoc,
    domePositionULoc,
    domeOrientationULoc,
    horizontalFOVULoc,
    domeLatitudeULoc;

var videoElement;

/*parameter*/
var params;

var screenWidth, screenHeight;
var doUpdateTexture = true;

var srcTexInfo = {
  shouldUpdate : false,
  type: "video"
};

//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {
  // fitCanvas();
  // window.addEventListener('resize', fitCanvas, false);
  screenWidth = screen.width;
  screenHeight = screen.height;
  console.log("screen dimensions: ", screenWidth, "x", screenHeight);
  setupFileHandling();
  videoElement = document.getElementById("vid-source");
  canvas = document.getElementById("glcanvas");

  initGUI();
  initWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (gl) {
    fitCanvas();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    //gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    //gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.

    initBuffers();

    // Next, load and set up the textures we'll be using.

    initTextures();

    // activateVideoListeners(videoElement);
  }
}

//see:
//http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
//http://stackoverflow.com/questions/11819768/webgl-gl-viewport-change
//http://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html

function fitCanvas() {
  var width = gl.canvas.clientWidth;
  var height = gl.canvas.clientHeight;
  if (gl.canvas.width != width || gl.canvas.height != height) {
     gl.canvas.width = width;
     gl.canvas.height = height;
     if (gl) {
         gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
     }
  }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional cube.
//
function initBuffers() {

  // Create a buffer for the cube's vertices.

  cubeVerticesBuffer = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  cubeVerticesTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);

  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3    // front
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {
  sourceTexture = gl.createTexture();
}

function initTexture(img, url, npot) {
  var tex = gl.createTexture();
  img = new Image();
  img.onload = function() { handleTextureLoaded(tex, img, npot); }
  img.src = url;
  console.log("init", img);
  return tex;
}

function handleTextureLoaded(texture, image, npot) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (npot) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  console.log("loaded", image);
}

//
// updateTexture
//
// Update the texture to contain the latest frame from
// our video.
//
function updateTexture() {
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, videoElement);
  /*for NPOT textures, see as well: https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences*/
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  /*for pot textures*/
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  // gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  if (srcTexInfo.playable) {
    updateTexture();
  }
  fitCanvas();
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  //setting uniforms
  gl.uniform2f(sizeULoc, gl.canvas.clientWidth, gl.canvas.clientHeight);
  // gl.uniform2f(sizeULoc, 1920.0, 1080.0);
  gl.uniform1f(domeRadiusULoc, params.domeRadius);
  gl.uniform3f(domePositionULoc, params.domePosX, params.domePosY, params.domePosZ);
  gl.uniform2f(domeOrientationULoc, deg2Rad(params.domeOrtX), deg2Rad(parseFloat(params.domeOrtY)+90));
  gl.uniform1f(horizontalFOVULoc, deg2Rad(params.horizontalFOV));
  gl.uniform1f(domeLatitudeULoc, deg2Rad(params.domeLatitude));
  // console.log("params", horizontalFOV, domeRadius, domePosX, domePosY, domePosZ, domeOrtX, domeOrtY);

  // Specify the texture to map onto the faces.

  var unitNo = 0;
  gl.activeTexture(gl.TEXTURE0 + unitNo);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.uniform1i(srcTexULoc, unitNo);
  unitNo++;

  // Draw the quad.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  loadFiles(['./glsl/domeviewer.vert', './glsl/domeviewer.frag'], function (shaderText) {
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

      textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
      gl.enableVertexAttribArray(textureCoordAttribute);

      //getting uniform locations
      srcTexULoc = gl.getUniformLocation(shaderProgram, "src_tex");
      sizeULoc = gl.getUniformLocation(shaderProgram, "size");
      domeRadiusULoc = gl.getUniformLocation(shaderProgram, "sphereRadius");
      domePositionULoc = gl.getUniformLocation(shaderProgram, "spherePosition");
      domeOrientationULoc = gl.getUniformLocation(shaderProgram, "sphereOrientation");
      horizontalFOVULoc = gl.getUniformLocation(shaderProgram, "horizontalFOV");
      domeLatitudeULoc = gl.getUniformLocation(shaderProgram, "sphereLatitude");

      //TODO: set pattern textures, since they won't change

  }, function (url) {
      alert('Failed to download "' + url + '"');
  });

}
//source:
//http://stackoverflow.com/questions/4878145/javascript-and-webgl-external-scripts
function loadFile(url, data, callback, errorCallback) {
    // Set up an asynchronous request
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    // Hook the event that gets called as the request progresses
    request.onreadystatechange = function () {
        // If the request is "DONE" (completed or failed)
        if (request.readyState == 4) {
            // If we got HTTP status 200 (OK)
            if (request.status == 200) {
                callback(request.responseText, data)
            } else { // Failed
                errorCallback(url);
            }
        }
    };

    request.send(null);
}

function loadFiles(urls, callback, errorCallback) {
    var numUrls = urls.length;
    var numComplete = 0;
    var result = [];

    // Callback for a single file
    function partialCallback(text, urlIndex) {
        result[urlIndex] = text;
        numComplete++;

        // When all files have downloaded
        if (numComplete == numUrls) {
            callback(result);
        }
    }

    for (var i = 0; i < numUrls; i++) {
        loadFile(urls[i], i, partialCallback, errorCallback);
    }
}

function setupFileHandling() {
  //source: http://codepen.io/SpencerCooley/pen/JtiFL/
  //check if browser supports file api and filereader features
  if (window.File && window.FileReader && window.FileList && window.Blob) {

     //this is not completely neccesary, just a nice function I found to make the file size format friendlier
  	//http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
  	function humanFileSize(bytes, si) {
  	    var thresh = si ? 1000 : 1024;
  	    if(bytes < thresh) return bytes + ' B';
  	    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
  	    var u = -1;
  	    do {
  	        bytes /= thresh;
  	        ++u;
  	    } while(bytes >= thresh);
  	    return bytes.toFixed(1)+' '+units[u];
  	}


    //this function is called when the input loads an image
  	function renderImage(file){
  		var reader = new FileReader();
  		reader.onload = function(event){
  			the_url = event.target.result
        //of course using a template library like handlebars.js is a better solution than just inserting a string
  			$('#preview').html("<img src='"+the_url+"' />")
  			$('#name').html(file.name)
  			$('#size').html(humanFileSize(file.size, "MB"))
  			$('#type').html(file.type)
  		}

      //when the file is read it triggers the onload event above.
  		reader.readAsDataURL(file);
  	}


    //TODO: rename?
  	function initVideo(file){
		    var url = URL.createObjectURL(file);
        //TODO: check and stop existing media!
        //TODO: on cancel?
        srcTexInfo.playable = false;
        var vidContainer = document.getElementById("video-container");
        try {
          videoElement.pause();
          videoElement.setAttribute("src", "");
          //videoElement.removeAttribute("src");
          videoElement.load();
          videoElement.removeEventListener("canplaythrough", startVideo, true);
          videoElement.removeEventListener("ended", videoDone, true);
          vidContainer.removeChild(document.getElementsByTagName("video")[0]);
        } catch (e) {
          console.error(e);
        }
        var vidContainer = document.getElementById("video-container");

        //of course using a template library like handlebars.js is a better solution than just inserting a string
        var vidContainer = document.getElementById("video-container");
        console.log(vidContainer);
        videoElement = document.createElement("video");
        videoElement.setAttribute('src', url);
        videoElement.setAttribute('autoplay', '');
        videoElement.setAttribute('muted', '');
        videoElement.setAttribute('loop', '');
        videoElement.setAttribute('type', 'video/mp4');
        vidContainer.appendChild(videoElement);


        videoElement.addEventListener("canplaythrough", startVideo.bind(videoElement), true);
        videoElement.addEventListener("ended", videoDone, true);
        srcTexInfo.playable = true;

        //activateVideoListeners(videoElement);
        // console.log("setting video source to", the_url);
        // $('#data-vid').html("<video autoplay muted loop><source id='vid-source' src='"+the_url+"' type='video/mp4'></video>")
        /*
        $('#name-vid').html(file.name)
  			$('#size-vid').html(humanFileSize(file.size, "MB"))
  			$('#type-vid').html(file.type)
        */

  	}

    //console.log(document);
    document.getElementById("the-video-file-field").addEventListener('change', function() {
  		//grab the first image in the fileList
  		//in this example we are only loading one file.
      var file = this.files[0];
  		console.log("file size:", file.size);
      console.log("file type:", file.type);
      //TODO: decide media type here?
      if(file.type.match(/video\/*/)){
  		  initVideo(this.files[0]);
      } else if (file.type.match(/image\/*/)) {
        //TODO:
        //initImage(this.files[0]);
      } else {
        console.log("Couldn't interpret image/video file: ", this.files[0]);
      }
  	}, false);

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

function activateVideoListeners(theVideoElement) {
  // Start listening for the canplaythrough event, so we don't
  // start playing the video until we can do so without stuttering

  theVideoElement.addEventListener("canplaythrough", startVideo.bind(theVideoElement), true);

  // Start listening for the ended event, so we can stop the
  // animation when the video is finished playing.

  theVideoElement.addEventListener("ended", videoDone, true);
  console.log("activate", doUpdateTexture);
}

function deactivateVideoListeners(theVideoElement) {
  theVideoElement.pause();
  theVideoElement.removeEventListener("canplaythrough", startVideo, true);
  theVideoElement.removeEventListener("ended", videoDone, true);
  videoDone();
  theVideoElement.removeAttribute("src");
  theVideoElement.load();
  console.log("deactivate", doUpdateTexture);
}

//
// startVideo
//
// Starts playing the video, so that it will start being used
// as our texture.
//
function startVideo() {
  this.play();
  this.muted = true;
  doUpdateTexture = true;
  intervalID = setInterval(drawScene, 30);
  //console.log("start video", doUpdateTexture);
}

//
// videoDone
//
// Called when the video is done playing; this will terminate
// the animation.
//
function videoDone() {
  doUpdateTexture = false;
  clearInterval(intervalID);
  console.log("video done called");
}

function initGUI() {
  params = {};
  params.horizontalFOV = 120;
  params.domeRadius = 3.0;
  params.domePosX = 0.0;
  params.domePosY = 0.0;
  params.domePosZ = 10.0;
  params.domeOrtX = 0.0;
  params.domeOrtY = 0.0;
  params.domeOrtZ = 0.0;
  params.domeLatitude = 90.0;

  initGUIElement("fov", "horizontalFOV");
  initGUIElement("dome-rad", "domeRadius");
  initGUIElement("dome-pos-x", "domePosX");
  initGUIElement("dome-pos-y", "domePosY");
  initGUIElement("dome-pos-z", "domePosZ");
  initGUIElement("dome-ort-x", "domeOrtX");
  initGUIElement("dome-ort-y", "domeOrtY");
  initGUIElement("dome-latitude", "domeLatitude");

  /*
  horizontalFOV = 120;
  document.getElementById("fov-input").addEventListener('input',
    function(event) {
      horizontalFOV = event.target.value;
  });
  document.getElementById("fov-input").value = horizontalFOV;
  */
}

function initGUIElement(id, paramName, startingValue) {
  var startingValue = params[paramName];
  document.getElementById(id + "-slider").addEventListener('input',
    function(event) {
      document.getElementById(id+"-input").value = event.target.value;
      params[paramName] = event.target.value;
  });
  document.getElementById(id + "-input").addEventListener('input',
    function(event) {
      document.getElementById(id+"-slider").value = event.target.value;
      params[paramName] = event.target.value;
  });
  document.getElementById(id+"-slider").value = startingValue;
  document.getElementById(id+"-input").value = startingValue;
}

function deg2Rad(d) {
  return d * Math.PI / 180;
}

function rad2Deg(r) {
  return r * 180 / Math.PI;
}
