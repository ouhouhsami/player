/**
 * @fileOverview
 * WAVE audio library module for buffer playing.
 * Caution: speed changes may harm state handling.
 * @author Karim Barkati
 * @version 0.2.0
 */

var events = require('events');

/**
 * Function invocation pattern for a simple player.
 * @public
 */
var createPlayer = function createPlayer(audioBuffer) {
  'use strict';

  var eventEmitter = new events.EventEmitter();

  /**
   * Simple player object as an ECMAScript5 properties object.
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

    // Player status
    IS_PLAYING: {
      value: "is_playing"
    },
    IS_PAUSED: {
      value: "is_paused"
    },
    IS_STOPPED: {
      value: "is_stopped"
    },
    status: {
      writable: true
    },

    /**
     * Mandatory initialization method.
     * @public
     * @chainable
     */
    init: {
      enumerable: true,
      value: function(audioBuffer) {

        this.context = window.audioContext;
        this.setBuffer(audioBuffer);
        this.status = this.IS_STOPPED;

        // Create web audio nodes, relying on the given audio context.
        this.gainNode = this.context.createGain();
        this.outputNode = this.context.createGain(); // dummy node to provide a web audio-like output node

        // this.on('ended', function() {
        //   console.log("Audio playing ended.");
        // });
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
     * Web audio API-like disconnect method.
     * @public
     * @chainable
     */
    disconnect: {
      enumerable: true,
      value: function(output) {
        this.gainNode.disconnect(output);
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
          if(this.source)
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
        if (this.status !== this.IS_STOPPED) {
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
        if (this.status !== this.IS_PLAYING) {
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
          this.status = this.IS_PLAYING;

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
        if (this.status === this.IS_PLAYING) {
          this.source.stop(0);
        }
        if (this.status !== this.IS_STOPPED) {
          this.status = this.IS_STOPPED;
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
        if (this.status === this.IS_PLAYING) {
          this.status = this.IS_PAUSED;
          this.source.stop(0);
          // Measure how much time passed since the last pause.
          this.startPosition = this.startPosition + this.getElapsedDuration();
          
          //TODO, check why pause() return this and stop and start return this.startPosition
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
        if (this.status === this.IS_PLAYING) {
          this.stop();
          this.startPosition = pos % this.bufferDuration;
          this.start();
        } else {
          this.startPosition = pos % this.bufferDuration;
        }
        return this.startPosition;
      }
    },

    /**
     * Get player status.
     * @public
     */
    getStatus: {
      enumerable: true,
      value: function() {
        return this.status;
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
          if ((that.status !== this.IS_PAUSED) && (that.getElapsedDuration() + that.startPosition > that.bufferDuration)) {
            if (!that.loop) {
              that.status = this.IS_STOPPED;
              that.startPosition = 0;
            }
            that.emit("ended", that.startPosition);
          }
        };
      }
    },

  };

  // Instantiate an object.
  var player = Object.create({}, playerObject);
  return player.init(audioBuffer);
};


// CommonJS function export
module.exports = createPlayer;
