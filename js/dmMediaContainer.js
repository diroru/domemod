var YoutubeVideo = require('./utils/YoutubeVideo.js');

var mediaContainerElement, currentURL;

var textureShouldUpdate = false;
var mediaType = undefined;
//0 – equirectangular
//1 - azimuthal 180°
//2 - azimuthal 360 °
var projectionType = 0;

var imageElement, videoElement;

function init(settings) {
  //source: http://codepen.io/SpencerCooley/pen/JtiFL/
  //check if browser supports file api and filereader features
  mediaContainerElement = document.getElementById(settings.mediaContainerId);
  if (window.File && window.FileReader && window.FileList && window.Blob) {

    //console.log(document);
    document.getElementById(settings.videoFileFieldId).addEventListener('change', function(event) {
  		//grab the first image in the fileList
  		//in this example we are only loading one file.
      console.log("file field event", event, event.files);
      // console.log("this", this);
      var file = this.files[0];
      if (file !== undefined) {
        console.log("file size:", file.size);
        console.log("file type:", file.type);
        if(file.type.match(/video\/*/)){
    		  setVideoSource(file);
        } else if (file.type.match(/image\/*/)) {
          setImageSource(file);
        } else {
          console.log("Couldn't interpret image/video file: ", this.files[0]);
        }
      } else {
        console.log("probably cancelled.");
      }
  	}, false);
    //console.log(document);
    document.getElementById(settings.youtubeVideoSumbitId).addEventListener('click', function(event) {
      event.preventDefault();
      var youtubeVideoID = document.getElementById("the-youtube-video-field").value;
      console.log("submit youtube video", youtubeVideoID);
      YoutubeVideo(youtubeVideoID, initYoutubeVideo);
    }, false);

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

function setImageSource(file) {
  console.log("file from inside init image", file);
  currentURL = (file instanceof File) ? URL.createObjectURL(file) : file;
   //TODO: check and stop existing media!
   //TODO: on cancel?
   textureShouldUpdate = false;

   if (mediaType === 'video') {
     clearVideo();
   }
   if (mediaType === 'image') {
     clearImage();
   }

   imageElement = document.createElement("img");

   imageElement.setAttribute('src', currentURL);
   mediaContainerElement.appendChild(imageElement);
   imageElement.addEventListener('load', loadImageCallback, true);
   //DEBUGGING

   mediaType = 'image';
   textureShouldUpdate = true;

   console.log("init image called", imageElement);
}

function setVideoSource(file) {
  currentURL = (file instanceof File) ? URL.createObjectURL(file) : file;
  console.log("video file", file);
  //TODO: check and stop existing media!
  //TODO: on cancel?
  textureShouldUpdate = false;

  if (mediaType === 'video') {
    clearVideo();
  }
  if (mediaType === 'image') {
    clearImage();
  }

  //of course using a template library like handlebars.js is a better solution than just inserting a string
  videoElement = document.createElement("video");
  videoElement.setAttribute('crossorigin', 'anonymous');
  videoElement.setAttribute('autoplay', '');
  // videoElement.setAttribute('muted', '');
  videoElement.setAttribute('loop', '');
  if (file.type !== undefined) videoElement.setAttribute('type', file.type);
  mediaContainerElement.appendChild(videoElement);
  videoElement.crossOrigin = 'Anonymous';
  videoElement.addEventListener("canplaythrough", startVideo.bind(videoElement), true);
  videoElement.addEventListener("ended", videoDone, true);
  videoElement.setAttribute('src', currentURL);
  videoElement.load();
  //videoElement.crossOrigin = 'Anonymous';
}

//TODO: donate to crossorigin.me
function initYoutubeVideo(theYoutubeVideo) {
  initVideo("https://crossorigin.me/" + theYoutubeVideo.getSource("video/mp4", "hd720").url); //TODO: See if this gets better
  // initVideo(theYoutubeVideo.getSource("video/mp4", "hd720").url); //TODO: See if this gets better
}

function clearVideo() {
  try {
    videoDone();
    videoElement.pause();
    videoElement.setAttribute("src", "");
    //videoElement.removeAttribute("src");
    videoElement.load();
    videoElement.removeEventListener("canplaythrough", startVideo, true);
    videoElement.removeEventListener("ended", videoDone, true);
    mediaContainerElement.removeChild(videoElement);
    // window.URL.revokeObjectURL(currentURL);
  } catch (e) {
    console.error(e);
  }
}

function clearImage() {
  try {
    // clearInterval(intervalID);
    // imageElement = mediaContainerElement.getElementsByTagName("img")[0];
    imageElement.setAttribute("src", "");
    //videoElement.removeAttribute("src");
    imageElement.removeEventListener("load", loadImageCallback, true);
    mediaContainerElement.removeChild(imageElement);
    // window.URL.revokeObjectURL(currentURL);
  } catch (e) {
    console.error(e);
  }
}

function loadImageCallback() {
  mediaType = 'image';
  textureShouldUpdate = true;
  // intervalID = setInterval(drawScene, 30);
  // console.log("load image callback triggered.");
}

//
// startVideo
//
// Starts playing the video, so that it will start being used
// as our texture.
//
function startVideo() {
  this.play();
  this.muted = false;
  // intervalID = setInterval(drawScene, 30);
  mediaType = 'video';
  textureShouldUpdate = true;
  console.log("start video", this);
}

//
// videoDone
//
// Called when the video is done playing; this will terminate
// the animation.
//
function videoDone() {
  // clearInterval(intervalID);
  // console.log("video done called");
}

function getMediaElement() {
  if (mediaType === 'video') {
    return videoElement;
  } else {
    return imageElement;
  }
}

function newTextureAvailable() {
  return textureShouldUpdate;
}

function setTextureShouldUpdate(b) {
  textureShouldUpdate = b;
}

function getMediaType() {
  return mediaType;
}

module.exports = {
  init: init,
  setImageSource: setImageSource,
  setVideoSource: setVideoSource,
  newTextureAvailable: newTextureAvailable,
  getMediaType: getMediaType,
  projectionType: projectionType,
  getMediaElement: getMediaElement,
  setTextureShouldUpdate: setTextureShouldUpdate
}
