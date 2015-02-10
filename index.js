/**
 * @fileOverview
 * WAVE audio library module for buffer playing.
 * Caution: speed changes may harm state handling.
 * @author Karim Barkati, Samuel Goldszmidt
 * @version 1.2.2
 */

'use strict'

require("audio-context"); //make an AudioContext instance globally available
var events = require('events');

var Player = (function(super$0){var DP$0 = Object.defineProperty;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,Object.getOwnPropertyDescriptor(s,p));}}return t};MIXIN$0(Player, super$0);

  function Player(buffer) {
    // private properties
    Object.defineProperties(Player.prototype, {
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
      }
    });

    /**
     * Mandatory initialization method.
     * @public
     * @chainable
     */
    this.status = this.IS_STOPPED;

    if (buffer) {
      this.setBuffer(buffer);
    }

    // Create web audio nodes, relying on the given audio context.
    this.gainNode = window.audioContext.createGain();
    this.outputNode = window.audioContext.createGain(); // dummy node to provide a web audio-like output node

    // this.on('ended', function() {
    //   console.log("Audio playing ended.");
    // });
    return this; // for chainability
  }Player.prototype = Object.create(super$0.prototype, {"constructor": {"value": Player, "configurable": true, "writable": true} });DP$0(Player, "prototype", {"configurable": false, "enumerable": false, "writable": false});

  /**
   * Web audio API-like connect method.
   * @public
   * @chainable
   */
  Player.prototype.connect = function(target) {
    this.outputNode = target;
    this.gainNode.connect(this.outputNode || window.audioContext.destination);
    return this; // for chainability
  }

  /**
   * Web audio API-like disconnect method.
   * @public
   * @chainable
   */
  Player.prototype.disconnect = function(output) {
    this.gainNode.disconnect(output);
    return this; // for chainability
  }

  /**
   * Set buffer and bufferDuration.
   * @public
   * @chainable
   */
  Player.prototype.setBuffer = function(buffer) {
    if (buffer) {
      this.buffer = buffer;
      this.bufferDuration = buffer.duration;
      return this; // for chainability
    } else {
      throw new Error("Buffer setting error");
    }
  }

  /**
   * Set gain value and squared volume.
   * @public
   * @chainable
   */
  Player.prototype.setGain = function(gain) {
    if (gain) {
      this.gain = gain;
      // Let's use an x-squared curve since simple linear (x) does not sound as good.
      this.gainNode.gain.value = gain * gain;
      return this; // for chainability
    } else {
      throw new Error("Gain setting error");
    }
  }

  /**
   * Set playback speed.
   * @public
   * @chainable
   */
  Player.prototype.setSpeed = function(val) {
    if (val) {
      this.speed = val;
      if (this.source)
        this.source.playbackRate.value = this.speed;
      return this; // for chainability
    } else {
      throw new Error("Speed setting error");
    }
  }

  /**
   * Enable or disable looping playback.
   * @public
   * @chainable
   */
  Player.prototype.enableLoop = function(bool) {
    this.loop = bool;
    if (this.status !== this.IS_STOPPED) {
      this.source.loop = this.loop;
    }
    return this; // for chainability
  }

  /**
   * Start playing.
   * @public
   */
  Player.prototype.start = function() {
    // Lock playing to avoid multiple sources creation.
    if (this.status !== this.IS_PLAYING) {
      // Configure a BufferSource.
      this.startedAtTime = window.audioContext.currentTime;
      this.source = window.audioContext.createBufferSource();
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
      //console.log("Already playing.");
    }
  }

  /**
   * Stop playing.
   * @public
   */
  Player.prototype.stop = function() {
    if (this.status === this.IS_PLAYING) {
      this.source.stop(0);
    }
    if (this.status !== this.IS_STOPPED) {
      this.status = this.IS_STOPPED;
      this.startPosition = 0;
      return this.startPosition;
    } else {
      //console.log("Already stopped.");
    }
  }

  /**
   * Pause playing.
   * @public
   */
  Player.prototype.pause = function() {
    if (this.status === this.IS_PLAYING) {
      this.status = this.IS_PAUSED;
      this.source.stop(0);
      // Measure how much time passed since the last pause.
      this.startPosition = this.startPosition + this.getElapsedDuration();

      return this.startPosition;
    } else {
      //console.log("Not playing.");
    }
  }

  /**
   * Seek buffer position (in sec).
   * @public
   */
  Player.prototype.seek = function(pos) {
    if (this.status === this.IS_PLAYING) {
      this.stop();
      this.startPosition = pos % this.bufferDuration;
      this.start();
    } else {
      this.startPosition = pos % this.bufferDuration;
    }
    return this.startPosition;
  }

  /**
   * Get player status.
   * @public
   */
  Player.prototype.getStatus = function() {
    return this.status;
  }

  /**
   * Compute elapsed duration since previous position change.
   * @private
   * @todo Handle speed changes.
   */
  Player.prototype.getElapsedDuration = function() {
    return window.audioContext.currentTime - this.startedAtTime;
  }

  /**
   * Release playing flag when the end of the buffer is reached.
   * @private
   * @todo Handle speed changes.
   */
  Player.prototype.setOnendedCallback = function() {
    var that = this;
    // Release source playing flag when the end of the buffer is reached.
    // Issue: the event comes late and is emitted on every source.stop(),
    // so it is necessary to check elapsed duration,
    // but speed changes can mess it up...
    this.source.onended = function() {
      //console.log("Elapsed duration on \'ended\' event:",
      //  that.getElapsedDuration() + that.startPosition,
      //  "sec");
      if ((that.status !== that.IS_PAUSED) && (that.getElapsedDuration() + that.startPosition > that.bufferDuration)) {
        if (!that.loop) {
          that.status = that.IS_STOPPED;
          that.startPosition = 0;
        }

        that.emit("ended", that.startPosition);
      }
    }
  }
;return Player;})(events.EventEmitter);

// CommonJS function export
module.exports = Player;
