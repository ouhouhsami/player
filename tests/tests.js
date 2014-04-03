var assert = chai.assert;

var audioContext = new webkitAudioContext();
var targetNode = audioContext.destination;
var player = null;
var audioBuffer = null;
var currentOffset = null;
var startTime = null;

describe("Sound: defs_audio_data.js", function() {
  var self = this;

  var myAudioBuffer = {
    duration: 7.263106575963719,
    gain: 1,
    length: 320303,
    numberOfChannels: 1,
    sampleRate: 44100
  };

  var myTimeout = 200000;
  var stepSpeed = 100;
  
  function isPlaying() {
    assert.equal(self.player.status, self.player.IS_PLAYING, "is not in playing mode");
  }
  
  function isPaused() {
    assert.equal(self.player.status, self.player.IS_PAUSED, "is not in playing mode");
  }
  
  function isStopped() {
  	assert.equal(self.player.status, self.player.IS_STOPPED, "is not in playing mode");
  }

  it('my player start with offset at 0', function(done) {
    this.timeout(myTimeout);
    
    var temp = Base64Binary.decodeArrayBuffer($theAudioFile);	
	
	audioContext.decodeAudioData(temp, function(audioBuffer) {
      self.audioBuffer = audioBuffer;
      self.player = createPlayer(self.audioBuffer, audioContext);
      self.player.connect(self.targetNode);
      var offset = self.player.start();
      assert.equal(offset, 0, "offset first start is not equal to 0");
      self.startTime = audioContext.currentTime;
      self.currentOffset = offset;
      isPlaying();
      done();
    });
    
  });

  it('my player pause', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.pause();
      var offset = self.player.startPosition;
      self.currentOffset = offset;
      assert.equal(offset, audioContext.currentTime, "offset of pause is not equals to audioContext.currentTime");
      isPaused();
      done();
    }, stepSpeed);
  });

  it('my player restart', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      var offset = self.player.start();
      assert.equal(self.currentOffset, offset, "offset of start doesn't match with pause");
      isPlaying();
      done();
    }, stepSpeed*2);
  });

  it('my player is ended', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.seek(Math.floor(myAudioBuffer.duration));
      self.player.on("ended", function() {
        done();
      });
    }, stepSpeed*3);
  });

  it('my player re-start after ended', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      var offset = self.player.start();
      assert.equal(offset, 0, "offset first start is not equal to 0");
      isPlaying();
      done();
    }, stepSpeed*4);
  });

  it('seek with overflow value', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      var seek = self.player.seek((Math.floor(myAudioBuffer.duration) + 5));
      var offset = self.player.startPosition;
      var overflow = (Math.floor(myAudioBuffer.duration) + 5) - myAudioBuffer.duration;
      assert.equal(offset, seek, "startPosition is not equal to seek return position");
      assert.closeTo(offset, overflow, 0.01, "overflow is not equal to startposition");
      done();
    }, stepSpeed*5);
  });

  it('set gain', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      var myGain = 0.4;
      self.player.setGain(myGain);
      assert.equal(myGain, self.player.gain, myGain.toString() + " is not equal to " + self.player.gain.toString());
      //float problem
      //assert.equal((myGain * myGain), self.player.gainNode.gain.value, (myGain * myGain).toString() + " is not equal to gainNode.gain.value : " + self.player.gainNode.gain.value.toString());
      done();
    }, stepSpeed*6);
  });
  
  it('my player restart', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.start();
      console.log(self.player.startPosition);
      assert.notEqual(self.player.startPosition, 0, "offset of start doesn't match with pause");
      isPlaying();
      done();
    }, stepSpeed*7);
  });
  
  it('set speed', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.seek(0); 
      var mySpeed = 1.2;
      self.player.setSpeed(mySpeed);
      assert.equal(mySpeed, self.player.speed, "speed player is not equal to mySpeed");
      assert.equal(mySpeed.toFixed(2), self.player.source.playbackRate.value.toFixed(2), "source playbackRate is not equal to mySpeed");
      done();
    }, stepSpeed*8);
  });
  
  it('set loop to true', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.enableLoop(true); 
      assert.isTrue(self.player.loop, "player loop is true");  
      assert.isTrue(self.player.source.loop, "source loop is true");  
      done();
    }, stepSpeed*9);
  });
  
  it('set loop to false', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.enableLoop(false); 
      assert.isFalse(self.player.loop, "player loop is true");  
      assert.isFalse(self.player.source.loop, "source loop is true");  
      done();
    }, stepSpeed*10);
  });
  
  it('can i hear sound ?', function(done){
    this.timeout(myTimeout);
    
    setTimeout(function(){
      var bufferSize = 2048;
      var recorder = audioContext.createJavaScriptNode(bufferSize, 2, 2);
      var count = 0;
      recorder.onaudioprocess = function(e) {
        if(count === 0) {
          var buffer = e.inputBuffer;
          var numberOfChannels = buffer.numberOfChannels;
          var array =  Array.prototype.slice.call(buffer.getChannelData(0));
          assert.equal($firstBuffer, array.join(','), 'first audiobuffer is not correct');
          done();
        }
        count++;
      };
      self.player.gainNode.connect(recorder);
      self.player.seek(0);
      recorder.connect(audioContext.destination);
      
    }, stepSpeed*11);
  });
  
  it('set pause and seek', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.pause();
      self.player.seek(1.2);
      isPaused();
      done();
    }, stepSpeed*12);
  });
  
  it('set play', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      var offset = self.player.start();
      assert.equal(offset, 1.2, 'offset is not ok');
      isPlaying();
      done();
    }, stepSpeed*13);
  });
  
  it('set stop', function(done) {
    this.timeout(myTimeout);

    setTimeout(function() {
      self.player.stop();
      isStopped();
      done();
    }, stepSpeed*14);
  });
  
  

});