domemod (beta)
==============

[domemod:](http://dimitarruszev.com/apps/beta/domemod) a webgl-based webtool for visualising fulldome media. This is only the source repository.

###Motivation

There is a myriad of websites that offer preview of panoramic media. On (are rather past) the brink of VR becoming the next hot medium, you can watch your _gopro_ footage in _youtube_ and on _facebook._ So why another panorama viewer? The motivation is twofold: 1. Fill out the space (niche) left by the others, provide a tool, a shortcut which enables hassle-free visualisation of fulldome media. 2. This is a personal learning project. More on that in the history section.

###Usage

Domemod allows you to view your files locally in your browser, without the need to upload them to a server or install desktop software. _(Please note that a modern browser is needed for this.)_ In the future, handheld support will be also added.

Most of the effort has flown so far into the functionality of the software, that's why (for now) the UI is rather spartan.

**GUI**

* **Choose File:**
opens a single image or video file. The video is looped and muted (the latter is a bug).


* **Projection Type:**
you may choose between <code>equirectangular</code> _(corresponds to general panoramic footage)_, <code>azimuthal 90°</code> _(or fulldome domemaster)_ and <code>azimuthal 180°</code> <small >This should become modular and extensible by using lookup-textures._

* **camera position x, y and z:** used to change viewer position. _Equivalent_ to <code>shift + mouse drag</code> on the canvas _(affects only x and z)._

* **camera orientation x and y:** to pan / tilt the camera. _Equivalent_ to <code>mouse drag</code>

* **dome radius:** the radius of the virtual dome. The units are arbitrary but coherent with the rest.


* **dome orientation x and y:** used to rotate the dome around its geometrical origin.

* **dome latitude:** shows the height of the dome canvas. 180° is, for example, a full sphere. _Suggestions for a better label, anybody?_

* **show grid:** Overlays a procedurally generated graticule. _Spot the bug!_

###Development and technical information

If you are interested in contributing in any way, open an issue, or look at the [domemod trelloboard](https://trello.com/b/LbJNnihb/domemod) or simply fork the project. Drop me a line if you want to be added to the board editors.

To make the app run locally, you need to clone / fork the repository, have [node](https://nodejs.org/en/) installed and run <code>npm install</code> from the project root. <code>npm run build</code> will watch / complile the source. You can use your favourite apache server (e.g. [MAMP](https://www.mamp.info/)) to serve the app.

As already mentioned, this is a learning project. It uses webgl. I have some prior experience with opengl; for webgl my favourite resources is among others [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) (also the source of some code snippets). Other than that, while I haven't fully embraced it yet, i really like the philosophy of [node](https://nodejs.org/) and its webgl counterpart, [stack.gl](http://stack.gl/). The core of the app is a custom fragment shader. It does some minimal raytracing, but only to analitically find intersections with a known sphere (the dome). This limits somewhat the extensibility of the project (e.g. you can't just add some 3d models to it) but ensures a good mix of rendering performance and visual quality. _(theoretically :)_ Some billboarding should be possible (and also planned) though.


###(Un)Known bugs

The app …

- … has been tested on OS X, in _Chrome 48_ and _Firefox 44_.

- … probably won't work on a handheld device, support is coming up.

- … ~~might have some graphical memory leak issues. The fix is coming up.~~ Reports of performance issues are welcome.


###History

The [original domemod](https://incom.org/projekt/1372) started as a [processing](http://processing.org/) application while i was studying at the [Potsdam University of Sciences](http://www.fh-potsdam.de/studieren/design/) and it was much less usable _(but in a way cooler)_. Also, it actually **failed** at mapping the pixels correctly! Shame on me.

[Christopher Warnow](https://github.com/chwarnow) joined the project to make a simplified [cinder](https://libcinder.org/) version to play videos. That was 2010. Since then, it has been in hybernation. And now it rises from the ashes! However, if you are interested in the old app, check it out at its archive [project page](https://incom.org/projekt/1372).
