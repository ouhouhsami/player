/** 
 * @fileOverview
 * WAVE audio library module for buffer playing.
 * Caution: speed changes can harm state handling.
 * @author Karim Barkati
 * @version 0.1.3
 *
 * @tutorial
 * var player = createPlayer(audioBuffer, audioContext);
 * player.connect(targetNode); // required to get sound
 * player.start();
 * player.pause();
 * player.stop();
 * ... plus: setBuffer, setGain, setSpeed, seek, enableLoop
 */

var events = require('events');

/**
 * Function invocation pattern for a simple player.
 * @public
 */
var createPlayer = function createPlayer(audioBuffer, audioContext) {
  'use strict';

  var eventEmitter = new events.EventEmitter();

  /**
   * Simple player object as an ecmascript5 properties object.
   */

  var playerObject = {

    // Private properties
    context: {
      writable: true
    },
    source: {
      writable: true
    },
    buffer: {
      writable: true
    },
    gainNode: {
      writable: true
    },
    outputNode: {
      writable: true
    },
    playing: {
      writable: true,
      value: false
    },
    paused: {
      writable: true,
      value: false
    },
    speed: {
      writable: true,
      value: 1
    },
    gain: {
      writable: true
    },
    loop: {
      writable: true,
      value: false
    },
    // For resuming after pause
    startPosition: {
      writable: true,
      value: 0
    },
    startedAtTime: {
      writable: true,
      value: 0
    },

    /**
     * Mandatory initialization method.
     * @public
     * @chainable
     */
    init: {
      enumerable: true,
      value: function(audioBuffer, audioContext) {

        this.context = audioContext;
        this.setBuffer(audioBuffer);

        // Create web audio nodes, relying on the given audio context.
        this.gainNode = this.context.createGain();
        this.outputNode = this.context.createGain(); // dummy node to provide a web audio-like output node

        this.on('ended', function() {
          // console.log("Audio playing ended.");
        });

        return this; // for chainability
      }
    },

    /**
     * Web audio API-like connect method.
     * @public
     * @chainable
     */
    connect: {
      enumerable: true,
      value: function(target) {
        this.outputNode = target;
        this.gainNode.connect(this.outputNode || this.context.destination);
        return this; // for chainability
      }
    },

    /**
     * Set buffer and bufferDuration.
     * @public
     * @chainable
     */
    setBuffer: {
      enumerable: true,
      value: function(buffer) {
        if (buffer) {
          this.buffer = buffer;
          this.bufferDuration = buffer.duration;
          return this; // for chainability
        } else {
          throw "Buffer setting error";
        }
      }
    },

    /**
     * Set gain value and squared volume.
     * @public
     * @chainable
     */
    setGain: {
      enumerable: true,
      value: function(gain) {
        if (gain) {
          this.gain = gain;
          // Let's use an x-squared curve since simple linear (x) does not sound as good.
          this.gainNode.gain.value = gain * gain;
          return this; // for chainability
        } else {
          throw "Gain setting error";
        }
      }
    },

    /**
     * Set playback speed.
     * @public
     * @chainable
     */
    setSpeed: {
      enumerable: true,
      value: function(val) {
        if (val) {
          this.speed = val;
          this.source.playbackRate.value = this.speed;
          return this; // for chainability
        } else {
          throw "Speed setting error";
        }
      }
    },

    /**
     * Enable or disable looping playback.
     * @public
     * @chainable
     */
    enableLoop: {
      enumerable: true,
      value: function(bool) {
        this.loop = bool;
        if (!this.stopped) {
          this.source.loop = this.loop;
        }
        return this; // for chainability
      }
    },

    /**
     * Start playing.
     * @public
     */
    start: {
      enumerable: true,
      value: function() {
        // Lock playing to avoid multiple sources creation.
        if (this.playing === false) {
          // Configure a BufferSource.
          this.startedAtTime = this.context.currentTime;
          this.source = this.context.createBufferSource();
          this.source.buffer = this.buffer;
          this.source.playbackRate.value = this.speed;
          this.source.loop = this.loop;
          this.source.connect(this.gainNode);

          // Resume but make sure we stay in bound of the buffer.
          var offset = this.startPosition % this.buffer.duration;
          this.source.start(0, offset); // optional 3rd argument as duration
          this.playing = true;
          this.paused = false;

          this.setOnendedCallback();

          return offset;
        } else {
          console.log("Already playing.");
        }
      }
    },

    /**
     * Stop playing.
     * @public
     */
    stop: {
      enumerable: true,
      value: function() {
        if (this.playing) {
          this.source.stop(0);
        }
        if (this.playing || this.paused) {
          this.playing = false;
          this.paused = false;
          this.startPosition = 0;
          return this.startPosition;
        } else {
          console.log("Already stopped.");
        }
      }
    },

    /**
     * Pause playing.
     * @public
     */
    pause: {
      enumerable: true,
      value: function() {
        if (this.playing) {
          this.playing = false;
          this.paused = true;
          this.source.stop(0);
          // Measure how much time passed since the last pause.
          this.startPosition = this.startPosition + this.getElapsedDuration();
          return this;
        } else {
          console.log("Not playing.");
        }
      }
    },

    /**
     * Seek buffer position (in sec).
     * @public
     */
    seek: {
      enumerable: true,
      value: function(pos) {
        if (this.playing) {
          this.stop();
          this.startPosition = pos;
          this.start();
        } else {
          this.startPosition = pos;
        }
        return this.startPosition;
      }
    },

    /**
     * Event listener.
     * @public
     */
    on: {
      enumerable: true,
      value: eventEmitter.on
    },

    /**
     * Event emitter.
     * @private
     */
    emit: {
      enumerable: false,
      value: eventEmitter.emit
    },

    /**
     * Compute elapsed duration since previous position change.
     * @private
     * @todo Handle speed changes.
     */
    getElapsedDuration: {
      enumerable: false,
      value: function() {
        return this.context.currentTime - this.startedAtTime;
      }
    },

    /**
     * Release playing flag when the end of the buffer is reached.
     * @private
     * @todo Handle speed changes.
     */
    setOnendedCallback: {
      enumerable: false,
      value: function() {
        var that = this;

        // Release source playing flag when the end of the buffer is reached.
        // Issue: the event comes late and is emitted on every source.stop(), 
        // so it is necessary to check elapsed duration,
        // but speed changes can mess it up...
        this.source.onended = function() {
          console.log("Elapsed duration on \'ended\' event:", 
            that.getElapsedDuration() + that.startPosition, 
            "sec");
          if (!that.paused && (that.getElapsedDuration() + that.startPosition > that.bufferDuration)) {
            if (!that.loop) {
              that.playing = false;
              that.startPosition = 0;
            }
            that.emit("ended", that.startPosition);
          }
        };
      }
    },

  };

  // Instantiate a granular engine with audio context and buffer.
  var player = Object.create({}, playerObject);
  return player.init(audioBuffer, audioContext);
};


// CommonJS function export
module.exports = createPlayer;