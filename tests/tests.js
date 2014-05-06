var assert = chai.assert;

window.AudioContext = window.AudioContext||window.webkitAudioContext;


// Here we create a buffer to be used later with our player
var audioContext = new AudioContext();
var targetNode = audioContext.destination;
var buffer = audioContext.createBuffer(1, 44100, 44100);
var data = buffer.getChannelData(0);
for (i = 0; i < data.length; i++) {
  data[i] = (Math.random() - 0.5) * 2;
}

describe("Sound play, pause, stop tests", function() {
  var self = this;
  var player;

  beforeEach( function(){
    self.player = createPlayer(buffer);
    self.player.connect(targetNode); 
  });
  
  afterEach( function(){
    self.player.stop(); 
  });


  it('should play when I play', function(){
    self.player.start();
    assert.equal(self.player.status, self.player.IS_PLAYING);
    assert.equal(self.player.getStatus(), self.player.status);
  });

  it('should stop when I stop', function(){
    self.player.start();
    self.player.stop();
    assert.equal(self.player.status, self.player.IS_STOPPED);
    assert.equal(self.player.getStatus(), self.player.status);
  });

  it('should pause when I pause', function(){
    self.player.start();
    self.player.pause();
    assert.equal(self.player.status, self.player.IS_PAUSED);
    assert.equal(self.player.getStatus(), self.player.status);
  });

  it('should start with 0 offset', function(){
    assert.equal(self.player.start(), 0);
  });

  it('should seek to the right time in non playing mode', function(){
    self.player.seek(1.2);
    assert.closeTo(self.player.startPosition, self.player.seek(0.2), 0.1); //add closeT insted of assert because of float problem
  });

  it('should seek to the right time in non playing mode, even if seek is larger than buffer size', function(){
    self.player.seek(1.5);
    assert.equal(self.player.startPosition, 0.5);
  });

  it('should seek to the right time in playing mode', function(){
    self.player.start();
    self.player.seek(0.5);
    assert.equal(self.player.startPosition, self.player.seek(0.5));
  });

  it('should set gain correctly', function(){
    self.player.setGain(3);
    assert.equal(self.player.gain, 3);
  });

  it('should set speed correctly', function(){
    // TODO: fix setSpeed which can't set speed prior to start !
    self.player.setSpeed(3);
    assert.equal(self.player.speed, 3);
  });

  it('should set loop mode in stop state', function(){
    self.player.enableLoop(true);
    assert.equal(self.player.loop, true);
  });

  it('should set loop mode in non stop state', function(){
    self.player.start();
    self.player.enableLoop(true);
    assert.equal(self.player.loop, true);
  });

  it('should dispatch event on ended', function(done){
    this.timeout(15000);
    self.player.on('ended', function(){
      done();
    });
    self.player.start();
  });

  it('should restart after a pause, at the right position', function(done){
    this.timeout(300);
    
    // Not sure we need this test.
    self.player.start();
    setTimeout(function(){
      self.player.pause();
      assert.equal(self.player.startPosition, self.player.start());
      done();
    }, 200);
  });

  it('should restart at 0, if end is reached and player restart', function(done){
    this.timeout(1200);
    
    self.player.start();
    setTimeout(function(){
      assert.equal(self.player.start(), 0);
      done();
      self.player.stop();
    }, 1100); // as my buffer length is 1 sec, I just need to wait a bit more.
  });

});
