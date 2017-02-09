# Antido3.js

Antido3.js is a website implementing an audio visualizer suite that involves 4 different types of visualizations built with WebGL. The website is based on HTML5, CSS3 and JavaScript for the frontend. Users are able to upload audio using drag/drop or manual submission. The website processes the audio and immediately starts creating the visualizations, one for each of the 4 tabs. Users can navigate through these tabs in real time and selectively determine which one to view.  The audio is processed into time-domain and frequency domain buffers using the WebAudio API, and rendered to HTML canvas elements in a realistic, visually responsive manner using the Three.js library. All backend code is written in JavaScript.

### Link To Website: [Antido3.js](http://www.music.mcgill.ca/~akdag/Antido3/antido3.html)

![alt text](https://github.com/nehirakdag/Antido3.js/blob/master/Images/mainpage.png)

# Implementation
The website is based on 5 tabs, one main welcoming tab which allows the user to upload their audio file to the website server. The other 4 are separate visualizers attempting to perform the task in their own unique way. 

### Birds
Tab 2 is a set of birds move around the canvas randomly. They are "scattered" or "repulse" the incoming audio signal.
![alt text](https://github.com/nehirakdag/Antido3.js/blob/master/Images/birds1.png)

### Cursors
Tab 3 is a set of dynamic cursors moving on the canvas according to audio frequency levels. The idea is to have a better looking, responsive 3D cursors that visualize the audio flow.
![alt text](https://github.com/nehirakdag/Antido3.js/blob/master/Images/cursors.gif)

### Bubbles
Tab 4 is a set of bubble-like spheres pseudo-randomly moving around the bounding box of the scene over time. They each light up firmly, producing a flash-like response to level peaks at each specific frequencies assigned to them. It is possible to "see" the sound as it peaks.
![alt text](https://github.com/nehirakdag/Antido3.js/blob/master/Images/bubbles.gif)

### Rings
Tab 5 is a set of rings that are produced at the center of the screen at each solid peak, extending outward after a shockwave-like entrance.
![alt text](https://github.com/nehirakdag/Antido3.js/blob/master/Images/rings.gif)


