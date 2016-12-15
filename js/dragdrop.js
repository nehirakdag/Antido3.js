var context = new AudioContext();
var audioUploaded = false;
var gainNode;
var analyser;
var fileInput = document.getElementById("uploader");

window.addEventListener('load', function() {
    // drop zone accepts both drag-drop and click to upload file
    var dropzone = document.querySelector('#holder');
    dropzone.addEventListener('drop', handleDrop, false)
    dropzone.addEventListener('dragover', handleDragOver, false)

    var uploadButton = document.querySelector('#dlbutton');
    uploadButton.addEventListener("click", function() {
        $('#uploader').trigger('click');
    }, false);
    
    fileInput.onchange = function(e) {
        handleUpload(e);
    }

})

var handleUpload = function(e) {
    e.preventDefault();
    e.stopPropagation();

    // if upload option is selected, play the uploaded audio
    var files = document.getElementById("uploader").files;
    playUploadedFile(files);
}

var handleDragOver = function(e) {
    e.preventDefault();
    e.stopPropagation();
}

var handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();

    // if file was dragged & dropped, play the dropped file
    var files = e.dataTransfer.files;

    playUploadedFile(files);
}

var playUploadedFile = function(files) {
    // if no files were selected, do nothing
    if( files.length <= 0) {
        return;
    }

    // if file was not of type audio, do nothing
    if(! files[0].type.startsWith("audio/")) {
        return;
    }

    var file = files[0];
    var reader = new FileReader();

    // once file is loaded, create a new audio context and 
    // pass the audio buffer to it
    reader.addEventListener('load', function(e) {
        var data = e.target.result;

        if(context.state != 'closed') {
            context.close();
        }
        context = new AudioContext();

        context.decodeAudioData(data, function(buffer) {
            // function call to set up analysers and start playing the song
            playSound(buffer);
        });
    });
    
    reader.readAsArrayBuffer(file);
    audioUploaded = true;
}

var playSound = function(buffer) {
    // create audio context buffer, gainNode (for volume adjustment)
    // and analyser objects
    var source = context.createBufferSource();
    gainNode = context.createGain();
    analyser = context.createAnalyser();

    gainNode.gain.value = 0.5;

    source.buffer = buffer;

    // cascade connect the source to destination with
    // the analyser and gain in between
    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(context.destination);

    source.start(0);

    // automatically start playing, aka trigger
    // the play button press
    $('#play').trigger('click');
    playing = 1;

    renderSelector();
}