var tabSelected = 0;
var currentTab = 0;
var requestID;

// Global variables needed for Three.js rendering
var scene, camera, renderer, controls, effect;
var geometry, material, mesh;

// The buttons on the website
var playButton = document.querySelector('#play');
var pauseButton = document.querySelector('#pause');
var stopButton = document.querySelector('#stop');

var volumeUpButton = document.querySelector('#volumeup');
var volumeDownButton = document.querySelector('#volumedown');

// Audio playing flag
var playing;
var mouseX = 0;
var mouseY = 0;

// Unused variables for future particle system addition
var tick = 0;
var clock = new THREE.Clock(true);

// Object to store postprocessing effect information
// to be called later
var postprocessing = {};
var previousValues = [];

// Global tracking variables for one of the 4 rendering formats
var circles = [];
var movingCircles = [];
var currentCircle = 0;

var waveCounter = 0;
var maxRadius = 3000;
var then = 0;

var birds = [];
var boids = [];

// Unused
var particleSystem;
var particleSystemSettings = {};

window.addEventListener('load', function() {
	// Add event listeners to each button so that they can perform their tasks
    playButton.addEventListener("click", playFunction, false);

    pauseButton.addEventListener("click", pauseFunction, false);

    stopButton.addEventListener("click", stopFunction, false);

    volumeUpButton.addEventListener("click", volumeUp, false);
    volumeDownButton.addEventListener("click", volumeDown, false);

});

var pauseFunction = function(e) {
	// Do nothing if no audio is uploaded
	if(audioUploaded) {

		// If paused, pause button will hide and 
		// the play button will take its place
		pauseButton.style.visibility = "hidden";
		playButton.style.visibility = "visible";

		// Pause the Audio context if it is running
		if(context.state === 'running') {
    		context.suspend();
    		playing = 0;
    	}
	}
}

var playFunction = function(e) {
	// Do nothing if no audio is uploaded
	if(audioUploaded) {
        
        // If play is pressed, play button will hide and 
		// the pause button will take its place
        playButton.style.visibility = "hidden";
		pauseButton.style.visibility = "visible";
    	
    	// Pause the Audio context if it is paused
    	if(context.state === 'suspended') {
    		context.resume();
    		playing = 1;
    	}
    }
}

var stopFunction = function(e) {
	// Do nothing if no audio is uploaded
	if(audioUploaded) {

		// If stop is pressed, pause button will hide and 
		// the play button will take its place
		pauseButton.style.visibility = "hidden";
		playButton.style.visibility = "visible";

		// Clear the uploaded audio flag, close the Audio Context
		audioUploaded = false;
		context.close();
		playing = 0;

		// Remove the uploaded file from the system
		fileInput.value = "";
	}
}

var volumeUp = function(e) {
	// Do nothing if no audio is uploaded
	if(audioUploaded) {

		// If at not max volume, increase volume by 10%
		if(gainNode.gain.value < 1) {
			gainNode.gain.value += parseFloat((0.1).toFixed(2));

			// Possible floating point error workaround
			if(gainNode.gain.value > 1) {
				gainNode.gain.value = 1;
			}
		}
	}
}

var volumeDown = function(e) {
	// Do nothing if no audio is uploaded
	if(audioUploaded) {

		// If at not max volume, increase volume by 10%
		if(gainNode.gain.value > 0) {
			gainNode.gain.value -= parseFloat((0.1).toFixed(2));

			// Possible floating point error workaround
			if(gainNode.gain.value < 0) {
				gainNode.gain.value = 0;
			}
		}
	}
}

// Each tab will call their functions to notify global
// variable keeping track of current tab and made selection.
// This way, we can remove canvases at unviewed tabs to reduce
// computing power used

// RenderSelector handles the view updates

function mainTab() {
	tabSelected = 1;
}

function birdsTab() {
	tabSelected = 2;

	renderSelector();
}

function threeDTab() {
	tabSelected = 3;
	renderSelector();
}

function bubblesTab() {
	tabSelected = 4;
	renderSelector();
}

function ringsTab() {
	tabSelected = 5;
	renderSelector();
}

// Canvases need to be responsive to window size changes.
// If on a tab when Three.js uses JS canvas, set sizes of each
// element appropriately to ensure smooth graphic transitions
function onWindowResize() {

	// Camera global variable is undefined initially.
	// Update only if needed
	if( typeof camera !== 'undefined' ){
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}

	// Renderer global variable is undefined initially.
	// Update only if needed
	if(typeof renderer !== 'undefined') {
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	// Composer global variable is undefined initially.
	// Update only if needed
	if(typeof postprocessing.composer !== 'undefined') {
		postprocessing.composer.setSize( window.innerWidth, window.innerHeight );
	}

}

function renderSelector() {
	// Controller to switch between tabs in the website.
	// Allows canvas management to reduce overhead.
	// Note that canvas tabs do not display anything if
	// no audio is playing
	if(tabSelected == currentTab) {
		return;
	}
	else {
		// If tab is changed, cancel the current animation frame
		window.cancelAnimationFrame(requestID);

		// Clear all the Three.js global variables
		if(typeof scene !== 'undefined' && scene != null) {
			clearScene(scene);
			scene = null;
			camera = null;
			renderer = null;
			controls = null;
			effect = null;
		}
	}
	
	// Tab #2 is "Dancers"
	if(tabSelected == 2) {
		if(audioUploaded) {
			//twoDrender();
			initDancers();
			renderDancers();
		}
		currentTab = 2;
	}
	// Tab #2 is "3D Cursors"
	else if(tabSelected == 3) {
		if(audioUploaded) {
			initThrees();
			threeDRenders();
		}
		currentTab = 3;
	}
	// Tab #4 is "Bubbles"
	else if(tabSelected == 4) {
		if(audioUploaded) {
			initStereo();
			stereoRender();
		}
		currentTab = 4;
	}
	// Tab #2 is "Flow Rings"
	else if(tabSelected == 5) {
		if(audioUploaded) {
			initRings();
			ringsRender();
		}
		currentTab = 5;
	}
}

// If a canvas is no longer to be used, remove all
// children of the scene before dereferencing it to 
// prevent memory leaks
function clearScene() {
	scene.children.forEach(function(object) {
		scene.remove(object);
	});
}

// Old function, used to be at tab 2
/*
function twoDRender() {

	var canvas = document.getElementById("analyser-2d");
	var canvasContext = canvas.getContext('2d');

	requestID = window.requestAnimationFrame(twoDRender);

	frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(frequencyArray);

	canvasContext.clearRect(0, 0, canvas.width, canvas.height);

	canvasContext.fillStyle = "#FF7C00";

	var bars = 100;

	for(var i = 0; i < bars; i++) {
		bar_x = i * 3;
		bar_width = 2;
		bar_height = -(frequencyArray[i] / 2);

		canvasContext.fillRect(bar_x, canvas.height, bar_width, bar_height);
	}

}*/

// Function to initialize tab #2. Tab#2 is a set of birds that move around the canvas randomly.
// The attempted idea is to have them "scatter" or "repulse" the incoming audio
// This is one of the tabs that could not be perfected
function initDancers() {

	// If the tab was clicked on again, clear the old canvas, place new one
	var dancers = document.getElementById("dancers");
	while(dancers.hasChildNodes()) {
		dancers.removeChild(dancers.lastChild);
	}

	// Initialize camera, set up position
	camera = new THREE.PerspectiveCamera( 28, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 450;

	// Set up a scene with a white background
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	// Initialize empty arrays
	birds = [];
	boids = [];

	// Place 200 birds at random x, y, z locations with random
	// x, y, z velocities on the set world boundaries
	for ( var i = 0; i < 200; i ++ ) {

		boid = boids[ i ] = new Boid();
		boid.position.x = Math.random() * 400 - 200;
		boid.position.y = Math.random() * 400 - 200;
		boid.position.z = Math.random() * 400 - 200;
		boid.velocity.x = Math.random() * 2 - 1;
		boid.velocity.y = Math.random() * 2 - 1;
		boid.velocity.z = Math.random() * 2 - 1;
		boid.setAvoidWalls( true );
		boid.setWorldSize( 500, 500, 400 );

		bird = birds[ i ] = new THREE.Mesh( new Bird(), new THREE.MeshBasicMaterial( { color:Math.random() * 0xffffff, side: THREE.DoubleSide } ) );
		bird.phase = Math.floor( Math.random() * 62.83 );
		scene.add( bird );

	}

	// Create the WebGL Renderer and adjust its settings
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	// Add resize support to the window
	window.addEventListener( 'resize', onWindowResize, false );

	// Add the renderer to the canvas DOM element
	dancers.appendChild( renderer.domElement );

	// Controls allow the user to use the Mouse to navigate through the scene
    controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = true;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

}

// Render functions are continuously called as part of Three.js
// And Javascript canvas' animation context
// This is the render function for Tab #2
function renderDancers() {
	requestID = window.requestAnimationFrame(renderDancers);

	// Initialize the frequency array from the Audio Context Analyser Node.
	// Store the 1024 indices to an array
	frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(frequencyArray);

	// Do not animate if audio is paused/is not playing
	if(playing) {
		// Move each bird with its built in function to display visual
		// flow for the viewer
		for(var i = 0; i < birds.length; i++) {
			boid = boids[ i ];
			boid.run( boids );

			bird = birds[ i ];
			bird.position.copy( boids[ i ].position );

			color = bird.material.color;
			color.r = color.g = color.b = ( 500 - bird.position.z ) / 1000;

			bird.rotation.y = Math.atan2( - boid.velocity.z, boid.velocity.x );
			bird.rotation.z = Math.asin( boid.velocity.y / boid.velocity.length() );

			bird.phase = ( bird.phase + ( Math.max( 0, bird.rotation.z ) + 0.1 )  ) % 62.83;
			bird.geometry.vertices[ 5 ].y = bird.geometry.vertices[ 4 ].y = Math.sin( bird.phase ) * 5;

			// If the song playing happens to have a kick at the current loop,
			// The birds will scatter and flock away from a point on the screen
			if(frequencyArray[0] > 50) {

				// Create a random vector, make the birds be repulsed by it
				var randomX = Math.random() * (window.innerWidth / 2);
				var randomY = Math.random() * (window.innerHeight / 2);
				var repulsor = new THREE.Vector3( randomX - window.innerWidth / 2, -1 * randomY + window.innerHeight / 2, 0 );
				repulsor.z = boid.position.z;

				// Multiple repulsions for a noticable change
				for(var k = 0; k < frequencyArray[0] / 15; k++) {
					boid.repulse( repulsor );
				}
			}

		}
	}

	// Render the scene with the updated controls (allows user
	// to move through the scene with the mouse)
	controls.update();
	renderer.render( scene, camera );

}

// Function to initialize tab #3. Tab#3 is a set of dynamic cursors
// moving on the canvas according to audio frequency levels
// The idea is to have a better looking, responsive 3D cursors
// that visualize the audio flow
function initThrees() {

	// If the tab was clicked on again, clear the old canvas, place new one
	var threeD = document.getElementById("threeD");
	while(threeD.hasChildNodes()) {
		threeD.removeChild(threeD.lastChild);
	}

	//frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	//analyser.getByteFrequencyData(frequencyArray);

	// Set a radius multiplier as a camera view scaling factor
	var radius = 100;

	// Set up a scene 
	scene = new THREE.Scene();

	// Initialize camera, set up position
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, radius * 1000);
	camera.position.z = radius * 50;

	// We will have multiple cursors that move with frequency value changes
	geometry = new THREE.BoxGeometry( 15, 30, 15 );

	// X index where the first cursor is situated
	var startingX = -5000;

	// More than a hundred cursors to show audio frequency levels
	for(var i = 0; i < 101; i++) {

		// Function call to assign a color to the cursor at this index
		var rgbString = rgbFromIndex(i, 100);

		// Create a colored wireframe material for the cursor's mesh, assign it with the box geometry
		var coloredMaterial = new THREE.MeshBasicMaterial( { color: rgbString, wireframe: true} );
		cube = new THREE.Mesh( geometry, coloredMaterial );

		// Each cursors position will be 100 units next to it on the x axis
		cube.position.x = startingX + i * 100;
		cube.position.y = 750;
		cube.name = i;

		// Add the cursor to the scene
		scene.add(cube);
	}

	// Create the WebGL Renderer and adjust its settings
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	// Add resize support to the window
	window.addEventListener( 'resize', onWindowResize, false );

	// Add the renderer to the canvas DOM element
	threeD.appendChild( renderer.domElement );

	// Controls allow the user to use the Mouse to navigate through the scene
	controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

}

// Render functions are continuously called as part of Three.js
// And Javascript canvas' animation context
// This is the render function for Tab #3
function threeDRenders() {
	requestID = window.requestAnimationFrame(threeDRenders);

	// Initialize the frequency array from the Audio Context Analyser Node.
	// Store the 1024 indices to an array
	frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(frequencyArray);

	// One can traverse a scene's children and manipulate them for
	// each animation frame according to the desired animation
	scene.traverse(function(child) {

		// Traverse each child attached to the scene, looking for Mesh
		// elements, aka the cursors we want to move
		if(child instanceof THREE.Mesh) {

			// Cursor will stay at 0 if audio is not playing.
			// Each cursor will describe the audio level of a specific frequency.
			// Mapping here is each index depicts the frequenct array position index * 5
			var scale = playing * frequencyArray[child.name * 5];
			
			// We do not want to zero any cursors, reduce to a very small number
			if(scale == 0) {
				scale = 0.01;
			}

			child.scale.y = scale;
		}
	});

	// Render the scene with the updated controls (allows user
	// to move through the scene with the mouse)
	controls.update();
	renderer.render( scene, camera );
}

// Helper function to translate a color code (0-255) to a hex value
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

// Helper function to return a hex color code for red, green, blue
// numbers (0-255 each)
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// Function to map a index value to a color. Used to make a smooth
// transition, displaying all colors like a rainbow style for each
// neighbor cursor. Each subsequent cursor will have a similar color
// to the one before it to provide better visuality
function rgbFromIndex(index, size) {
	var red, green, blue;

	if(index <= size / 5) {
		red = 255;
		green = index * 255 / (size / 5);
		blue = 0;
	}
	else if(index <= size * 2 / 5) {
		red = 255 - ((index - size / 5) * 255 / (size / 5));
		green = 255;
		blue = 0;
	}
	else if(index <= size * 3 / 5) {
		red = 0;
		green = 255;
		blue = (index - size * 2 / 5) * 255 / (size / 5);
	}
	else if(index <= size * 4 / 5) {
		red = 0;
		green = 255 - ((index - size * 3 / 5) * 255 / (size / 5));
		blue = 255;
	}
	else{
		red = (index - size * 4 / 5) * 255 / (size / 5);
		green = 0;
		blue = 255;
	}

	return rgbToHex(Math.floor(red), Math.floor(green), Math.floor(blue));
}

// Function to initialize tab #4. Tab#4 is a set of bubble-like spheres
// pseudo-randomly moving around the bounding box of the scene over time.
// They each light up firmly, producing a flash-like response to level peaks
// at each specific frequencies assigned to them. The idea is to "see" the
// sound when it peaks
function initStereo() {

	// If the tab was clicked on again, clear the old canvas, place new one
	var stereo = document.getElementById("stereo");
	while(stereo.hasChildNodes()) {
		stereo.removeChild(stereo.lastChild);
	}

	frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(frequencyArray);

	// Will have to keep track of the previous values to catch peaks
	previousValues = [];

	// Set a radius multiplier as a camera view scaling factor
	var radius = 100;

	// Set up a scene 
	scene = new THREE.Scene();

	// Initialize camera, set up position
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, radius * 1000 );
    camera.position.z = radius * 90;
    camera.position.y = 1 * radius * 90;

    // We will have multiple spheres each moving around, depicting peaks at specific frequencies
	geometry = new THREE.SphereBufferGeometry( 100, 32, 16 );
	
	// Give a faint texture to the spheeres just for visual richness
	// Textures are taken from the three.js public examples folder
	var textureCube = new THREE.CubeTextureLoader()
        .setPath( 'three.js-master/examples/textures/cube/Park3Med/' )
        .load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
    textureCube.mapping = THREE.CubeRefractionMapping;
	
	for(var i = 0; i < 101; i++) {

		// Function call to assign a color to the shere at this index
		var rgbString = rgbFromIndex(i, 100);

		// Each sphere will have its own shader to pulse a color
		var shaderColor = new THREE.Color();
		shaderColor.set(rgbString);

		// A shader material has uniform constants.
		// Each of these parameters are arrived to after trial and error.
		// The initial glow color is white, which will change as the song peaks
		var shaderMaterial = new THREE.ShaderMaterial({
		    uniforms:
			{ 
				"c":   { type: "f", value: 0.5 },
				"p":   { type: "f", value: 0.01 },
				glowColor: { type: "c", value: 0xffffff },
				viewVector: { type: "v3", value: camera.position }
			},
			vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
			fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
			side: THREE.FrontSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		});


		// Create the mesh with the specified geometry and material
		mesh = new THREE.Mesh( geometry, shaderMaterial.clone() );

		// Place the mesh to a random x, y, z position within the bounding box
		// of the scene
		mesh.position.x = Math.random() * 10000 - 5000;
        mesh.position.y = Math.random() * 10000 - 5000;
        mesh.position.z = Math.random() * 10000 - 5000;
        mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;
		
        // Each mesh carries with it an id to enable color detection for it
		mesh.name = i;
		mesh.receiveShadow = true;
		mesh.castShadow = true;

		// Add the shpere to the scene
		scene.add(mesh);

		// Fill the previous values array with frequency input
		previousValues.push(frequencyArray[i * 5]);
	}

	// Ambient soft white light for the scene
	var light = new THREE.AmbientLight( 0x404040 ); 
	light.intensity = 1.0;
	scene.add( light );

	// Create the WebGL Renderer and adjust its settings
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	// Initialize postprocessing elements. These add further
	// effects to the scene. I was using it initially but right now does nothing
	initStereoPostprocessing();

	renderer.autoClear = false;

	// Add resize support to the window
	window.addEventListener( 'resize', onWindowResize, false );

	// Add the renderer to the canvas DOM element
	stereo.appendChild( renderer.domElement );

	// Controls allow the user to use the Mouse to navigate through the scene
    controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = true;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
}

// Render functions are continuously called as part of Three.js
// And Javascript canvas' animation context
// This is the render function for Tab #4
function stereoRender() {
	requestID = window.requestAnimationFrame(stereoRender);

	// Initialize the frequency array from the Audio Context Analyser Node.
	// Store the 1024 indices to an array
	frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(frequencyArray);

	// One can traverse a scene's children and manipulate them for
	// each animation frame according to the desired animation
	scene.traverse(function(child) {

		// Traverse each child attached to the scene, looking for Meshes with
		// Shaders as material, aka the spheres we want to light up
		if(child.material instanceof THREE.ShaderMaterial) {

			// Keep a timer for pseudo random movement of spheres
			var timer = 0.0001 * Date.now();

			// Do not move spheres unless audio is playing
			if(playing) {
				child.position.x = 5000 * Math.cos( timer + child.name );
	        	child.position.y = 5000 * Math.sin( timer + child.name * 1.1 );
			}
			else{
				child.position.x = child.position.x;
				child.position.y = child.position.y;
			}
	        
	        // If the current value at that frequency index is greater than 10 of the same value
	        // at the last iteration, light up the sphere (works well visually as far as I was able to test)
	        if(frequencyArray[child.name * 5] > previousValues[child.name] + 10) {
	        	
	        	// Use the same index to color algorithm to select the sphere's color
				child.material.uniforms.glowColor.value = new THREE.Color(rgbFromIndex(child.name, 100));
				child.material.uniforms.p.value = 0.01;
	        }
	        else{
	        	// If no peak is detected, sphere goes back to dim white, almost transparent refractive form
	        	child.material.uniforms.glowColor.value = new THREE.Color(rgbFromIndex(child.name, 100)).setHSL(1, 0.1, 0.1);
	        	child.material.uniforms.c.value = 0.5;
	        	child.material.uniforms.p.value = 0.01;

			}

			// Update the previous values array
			previousValues[child.name] = frequencyArray[child.name * 5];

		}
	});

	// Render the scene with the updated controls (allows user
	// to move through the scene with the mouse)
	controls.update();
	//renderer.render( scene, camera );
	//effect.render( scene, camera );
	postprocessing.composer.render( 0.1 );
}

// Helper function used to initialize effects that will be used to
// add to the scene. Two effects I considered using were Bookeh (for blur)
// and the digital glitch effect.
// I wanted to create a glitch at every solid peak, but for some reason 
// There is no online documentation whatsoever about how to do this.
// By default produces glitches at random time intervals. Must be looked into further.
function initStereoPostprocessing() {
	var renderPass = new THREE.RenderPass( scene, camera );

	var bokehPass = new THREE.BokehPass( scene, camera, {
		focus: 		1.425,
		aperture:	0.035,
		maxblur:	1.0,

		width: window.innerWidth,
		height: window.innerHeight
	} );

	var glitchPass = new THREE.GlitchPass(1);

	bokehPass.renderToScreen = true;
	//glitchPass.renderToScreen = true;

	var composer = new THREE.EffectComposer( renderer );

	composer.addPass( renderPass );
	//composer.addPass( glitchPass );
	composer.addPass( bokehPass );

	var effect = new THREE.ShaderPass( THREE.CopyShader );
    //effect.renderToScreen = true;
    composer.addPass( effect );

	postprocessing.composer = composer;
	postprocessing.bokeh = bokehPass;
	postprocessing.glitch = glitchPass;
}

// I was going to use this function after noticing low bands have
// higher levels, but a specific pinpoint of numeric value
// is unrealistic because each song has its own level.
// Finding a level detection algorithm is beyond the scope of 
// my project, altough I would love to add it in the future

/*
function getThresholdForIndex(index) {
	if( index < 50 ) {
		return 150;
	}
	else if( index < 100 ) {
		return 100;
	}
	else {
		return 50;
	}
}*/

// Function to initialize tab #5. Tab#5 is a set of rings that are produced at the
// center of the screen at each solid peak, extending outward after a shockwave-like
// entrance. It mimicks the idea used in this project I found online:
// https://airtightinteractive.com/demos/js/reactive/
// ^ This project has no source code avaiable though, I wanted to improve it,
// so I had to create from scratch. I wanted to add my ideas to it,
// which is why I went about creating this in a tab, however
// this is by far the most complex task out of the 4 tabs that create visualizations.
// It is imperfect and needs to be improved to achieve a better sensitivity at peaks
// and when to create rings to extend them outwards and when to wait
function initRings() {

	// If the tab was clicked on again, clear the old canvas, place new one
	var rings = document.getElementById("rings");
	while(rings.hasChildNodes()) {
		rings.removeChild(rings.lastChild);
	}

	// Clear previously occupied values in case of double clicking the tab
	previousValues = [];
	circles = [];
	movingCircles = [];
	currentCircle = 0;
	waveCounter = 0;

	frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(frequencyArray);

	// Set a radius multiplier as a camera view scaling factor
	var radius = 100;

	// Set up a scene 
	scene = new THREE.Scene();

	// Initialize camera, set up position
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, radius * 1000);
	camera.position.z = radius * 25;
	//camera.rotation.y = -100 * Math.PI / 180;

	// Each circle (ring) will have 360 vertices, one for each angle
	var numVertices = 360;

	for(var k = 0; k < 100; k++) {
		
		// Function call to assign a color to the circle at this index
		var rgbString = rgbFromIndex(k, 100);

		// A circle is basically a  line that goes round with 360 vertices at specific positions.
		// At initialization, each will have no shape for now. They will be instantiated
		// and extended outward as the song peaks
		var circle = new THREE.Line( new THREE.Geometry(), new THREE.LineBasicMaterial( {color:rgbString}));
		
		for(var i = 0; i <= numVertices; i++) {
			var angle = Math.PI * i /180;
			var xCoord = 0;
			var yCoord = 0;
			var zCoord = 0;

			// Each circle needs an id (name), transverse velocity and outward velocity
			// There is actually some pretty solid math involved in this
			circle.name = k;
			circle.transverseVelocity = 0;
			circle.outwardVelocity = 0;

			// Add the vertices to the circle's geometry so they can be altered later
			circle.geometry.vertices.push(new THREE.Vector3(xCoord, yCoord, zCoord));
		}

		// Add the circles to the scene and to the global array of circles
		// for easier manipulation and referencing
		scene.add(circle);
		circles.push(circle);

		// This is an array that indicates if the circle at the specific index is moving or not
		movingCircles.push(0);
	}

	// Create the WebGL Renderer and adjust its settings
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );

	// Add resize support to the window
	window.addEventListener( 'resize', onWindowResize, false );

	// Add the renderer to the canvas DOM element
	rings.appendChild( renderer.domElement );

	// Controls allow the user to use the Mouse to navigate through the scene
	controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

}

// Render functions are continuously called as part of Three.js
// And Javascript canvas' animation context
// This is the render function for Tab #5
function ringsRender() {
	requestID = window.requestAnimationFrame(ringsRender);

	// Initialize the frequency array from the Audio Context Analyser Node.
	// Store the 1024 indices to an array
	// I also use the time domain to try to pinpoint peaks with better precision
	// But the mathematics of peak detection and method of audio processing
	// definitely needs to be improved here in order to perfect the visualizer
	frequencyArray = new Uint8Array(analyser.frequencyBinCount);
	timeArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(frequencyArray);
	analyser.getByteTimeDomainData(timeArray);

	// Move velocity is the velocity that the circle extends its radius outward
	var moveVelocity = 15;

	// Extra parameters to attempt more selective and precise instantiations
	var currentlyAt = currentCircle;
	var now = Date.now();

	// Iterate through each circle in the circles array
	for(var i = 0; i < circles.length+1; i++) {
		// integer used to make transpose waves move on the ring
		waveCounter++;

		// Do nothing if no audio is playing
		if(playing) {

			// If the currently checked circle is already instantiated (aka at moving state)
			if(movingCircles[i]) {

				// If its radius has gone past the maximum boundary, remove it from scene
				// so that it can be rendered again in the center
				if(getRadius(circles[i]) > maxRadius) {
					circles[i].geometry.vertices = deleteCircleVertices();
					movingCircles[i] = 0;
				}
				else{
					// If not, keep extending it outward
					circles[i].geometry.vertices = moveCircle(circles[i], circles[i].velocity);
				}
				
				// This is how Three.js tells that is should update vertex positions
				circles[i].geometry.verticesNeedUpdate = true;
			}
			else{

				// My attempt to detect a peak, altough I have not had the chance to
				// examine the time domain array in more detail
				// Also, a small mandatory 100 millisecond delay to eliminate
				// consecutive renderings for really close times
				if(timeArray[timeArray.length-1] > 150 && now - then > 100) {

					// Find a random circle that is not moving (solely for random colors)
					/*var random;
					do{
						random = Math.floor(Math.random() * 100);
					} while(movingCircles[random]);*/

					// Transpose wave starts moving with a velocity based on the frequency array's level
					// At this moment
					var startingVelocity = frequencyArray[currentCircle * 5] / 10;
					circles[currentCircle].outwardVelocity = 10;

					// Call helper function to update vertices
					circles[currentCircle].geometry.vertices = moveCircle(circles[currentCircle], startingVelocity * 2);
					circles[currentCircle].geometry.verticesNeedUpdate = true;

					// I was going to add different colors to rings based on levels but
					// this will have to be a future goal for now
					/*var strength = timeArray[timeArray.length-1] / 250;
					var lerper;

					if(strength < 0.5) {
						lerper = new THREE.Color(0x000000);
					}
					else{
						lerper = new THREE.Color(0xffffff);
					}

					circles[random].material.color = circles[random].material.color.lerp(lerper, strength);
					circles[random].material.needsUpdate = true; */

					// Flag the circle as moving
					movingCircles[currentCircle] = 1;

					currentCircle++;
					then = now;

					if(currentCircle >= circles.length) {
						currentCircle = 0;
					}

				}
			}
			
			
		}
	}

	// Render the scene with the updated controls (allows user
	// to move through the scene with the mouse)
	controls.update();
	renderer.render( scene, camera );

	//effect.render( scene, camera );
	//postprocessing.composer.render( 0.1 );
}

// Helper function to find the new vertex positions of a given
// circle. This is where the heavy math takes place
function moveCircle(circle, velocity) {
	var newVertices = [];
	var radius = 100;
	var numWaves = radius / 10;
	var waveHeight = 0.1 * radius;

	// I set the z axis displacement as the current bass level. Works okay
	// but can definitely be improved
	var zRadius = frequencyArray[0];

	// Outward velocity stays constant
	var outwardVelocity = circle.outwardVelocity;

	// Idea for transverse wave is to start as a shockwave at the beginning,
	// and eventually die out as time goes on. An exponential e^-x function
	// is used to achieve this
	var transverseVelocity = velocity * (Math.exp(-1 * getRadius(circle) / 1000));

	// Update the current velocity
	circle.velocity = transverseVelocity;

	// For each vertex, calculate the z-displacement (deltaRadius),
	// and trigonometric functions are used to translate the vertices to new positions
	for(var i = 0; i <= 360; i++) {
		var angle = Math.PI * i / 180;
		var deltaRadius = zRadius / 10 * Math.sin( (angle + waveCounter / radius * 2) * numWaves);

		// Determine coordinates and push the new vertext positions to the circle so they can be updated
		var xCoord = circle.geometry.vertices[i].x + outwardVelocity * Math.cos(angle);
		var yCoord = circle.geometry.vertices[i].y + outwardVelocity * Math.sin(angle);
		var zCoord = transverseVelocity * (deltaRadius) * Math.sin(angle);

		newVertices.push(new THREE.Vector3(xCoord, yCoord, zCoord));
	}

	return newVertices;
}

// Helper function to delete a circle from the scene
// aka setting all its vertices at (0, 0, 0)
function deleteCircleVertices() {
	var newVertices = [];

	for(var i = 0; i <= 360; i++) {
		newVertices.push(new THREE.Vector3(0, 0, 0));
	}

	return newVertices;
}

// Helper function to get the radius of a circle.
function getRadius(circle) {
	var x = circle.geometry.vertices[0].x;
	var y = circle.geometry.vertices[0].y;

	return Math.sqrt(x * x + y * y);
}