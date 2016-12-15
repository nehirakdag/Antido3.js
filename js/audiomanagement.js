var playButton = document.querySelector('#play');
var pauseButton = document.querySelector('#pause');
var stopButton = document.querySelector('#stop');

var volumeUpButton = document.querySelector('#volumeup');
var volumeDownButton = document.querySelector('#volumedown');

window.addEventListener('load', function() {
    playButton.addEventListener("click", playFunction, false);

    pauseButton.addEventListener("click", pauseFunction, false);

    stopButton.addEventListener("click", stopFunction, false);

    volumeUpButton.addEventListener("click", volumeUp, false);
    volumeDownButton.addEventListener("click", volumeDown, false);
});

var pauseFunction = function(e) {
	if(audioUploaded) {
	        
		pauseButton.style.visibility = "hidden";
		playButton.style.visibility = "visible";

		if(context.state === 'running') {
    		context.suspend();
    	}
	}
}

var playFunction = function(e) {
	if(audioUploaded) {
        
        playButton.style.visibility = "hidden";
		pauseButton.style.visibility = "visible";
    	
    	if(context.state === 'suspended') {
    		context.resume();
    	}
    }
}

var stopFunction = function(e) {
	if(audioUploaded) {
		pauseButton.style.visibility = "hidden";
		playButton.style.visibility = "visible";

		audioUploaded = false;
		context.close();
	}
}

var volumeUp = function(e) {
	if(audioUploaded) {
		if(gainNode.gain.value < 1) {
			gainNode.gain.value += parseFloat((0.1).toFixed(2));

			if(gainNode.gain.value > 1) {
				gainNode.gain.value = 1;
			}
		}
	}
}

var volumeDown = function(e) {
	if(audioUploaded) {
		if(gainNode.gain.value > 0) {
			gainNode.gain.value -= parseFloat((0.1).toFixed(2));

			if(gainNode.gain.value < 0) {
				gainNode.gain.value = 0;
			}
		}
	}
}