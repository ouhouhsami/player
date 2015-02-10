!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Player=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* 

This monkeypatch library is intended to be included in projects that are
written to the proper AudioContext spec (instead of webkitAudioContext), 
and that use the new naming and proper bits of the Web Audio API (e.g. 
using BufferSourceNode.start() instead of BufferSourceNode.noteOn()), but may
have to run on systems that only support the deprecated bits.

This library should be harmless to include if the browser supports 
unprefixed "AudioContext", and/or if it supports the new names.  

The patches this library handles:
if window.AudioContext is unsupported, it will be aliased to webkitAudioContext().
if AudioBufferSourceNode.start() is unimplemented, it will be routed to noteOn() or
noteGrainOn(), depending on parameters.

The following aliases only take effect if the new names are not already in place:

AudioBufferSourceNode.stop() is aliased to noteOff()
AudioContext.createGain() is aliased to createGainNode()
AudioContext.createDelay() is aliased to createDelayNode()
AudioContext.createScriptProcessor() is aliased to createJavaScriptNode()
AudioContext.createPeriodicWave() is aliased to createWaveTable()
OscillatorNode.start() is aliased to noteOn()
OscillatorNode.stop() is aliased to noteOff()
OscillatorNode.setPeriodicWave() is aliased to setWaveTable()
AudioParam.setTargetAtTime() is aliased to setTargetValueAtTime()

This library does NOT patch the enumerated type changes, as it is 
recommended in the specification that implementations support both integer
and string types for AudioPannerNode.panningModel, AudioPannerNode.distanceModel 
BiquadFilterNode.type and OscillatorNode.type.

*/
(function (global, exports, perf) {
  'use strict';

  function fixSetTarget(param) {
    if (!param) // if NYI, just return
      return;
    if (!param.setTargetAtTime)
      param.setTargetAtTime = param.setTargetValueAtTime; 
  }

  if (window.hasOwnProperty('webkitAudioContext') && 
      !window.hasOwnProperty('AudioContext')) {
    window.AudioContext = webkitAudioContext;

    if (!AudioContext.prototype.hasOwnProperty('createGain'))
      AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
    if (!AudioContext.prototype.hasOwnProperty('createDelay'))
      AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
    if (!AudioContext.prototype.hasOwnProperty('createScriptProcessor'))
      AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;
    if (!AudioContext.prototype.hasOwnProperty('createPeriodicWave'))
      AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;


    AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function() { 
      var node = this.internal_createGain();
      fixSetTarget(node.gain);
      return node;
    };

    AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
    AudioContext.prototype.createDelay = function(maxDelayTime) { 
      var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
      fixSetTarget(node.delayTime);
      return node;
    };

    AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function() { 
      var node = this.internal_createBufferSource();
      if (!node.start) {
        node.start = function ( when, offset, duration ) {
          if ( offset || duration )
            this.noteGrainOn( when, offset, duration );
          else
            this.noteOn( when );
        };
      }
      if (!node.stop)
        node.stop = node.noteOff;
      fixSetTarget(node.playbackRate);
      return node;
    };

    AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function() { 
      var node = this.internal_createDynamicsCompressor();
      fixSetTarget(node.threshold);
      fixSetTarget(node.knee);
      fixSetTarget(node.ratio);
      fixSetTarget(node.reduction);
      fixSetTarget(node.attack);
      fixSetTarget(node.release);
      return node;
    };

    AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
    AudioContext.prototype.createBiquadFilter = function() { 
      var node = this.internal_createBiquadFilter();
      fixSetTarget(node.frequency);
      fixSetTarget(node.detune);
      fixSetTarget(node.Q);
      fixSetTarget(node.gain);
      return node;
    };

    if (AudioContext.prototype.hasOwnProperty( 'createOscillator' )) {
      AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function() { 
        var node = this.internal_createOscillator();
        if (!node.start)
          node.start = node.noteOn; 
        if (!node.stop)
          node.stop = node.noteOff;
        if (!node.setPeriodicWave)
          node.setPeriodicWave = node.setWaveTable;
        fixSetTarget(node.frequency);
        fixSetTarget(node.detune);
        return node;
      };
    }
  }
}(window));
},{}],2:[function(require,module,exports){
/*globals AudioContext*/
require('./ac-monkeypatch');
window.waves = window.waves || {};
module.exports = window.waves.audioContext = window.waves.audioContext || new AudioContext();
},{"./ac-monkeypatch":1}],3:[function(require,module,exports){
"use strict";
'use strict';
var audioContext = require("audio-context");
var events = require('events');
var Player = function Player(buffer) {
  Object.defineProperties($Player.prototype, {
    source: {writable: true},
    buffer: {writable: true},
    gainNode: {writable: true},
    outputNode: {writable: true},
    speed: {
      writable: true,
      value: 1
    },
    gain: {writable: true},
    loop: {
      writable: true,
      value: false
    },
    startPosition: {
      writable: true,
      value: 0
    },
    startedAtTime: {
      writable: true,
      value: 0
    },
    IS_PLAYING: {value: "is_playing"},
    IS_PAUSED: {value: "is_paused"},
    IS_STOPPED: {value: "is_stopped"},
    status: {writable: true}
  });
  this.status = this.IS_STOPPED;
  if (buffer) {
    this.setBuffer(buffer);
  }
  this.gainNode = audioContext.createGain();
  this.outputNode = audioContext.createGain();
  return this;
};
var $Player = Player;
($traceurRuntime.createClass)(Player, {
  connect: function(target) {
    this.outputNode = target;
    this.gainNode.connect(this.outputNode || audioContext.destination);
    return this;
  },
  disconnect: function(output) {
    this.gainNode.disconnect(output);
    return this;
  },
  setBuffer: function(buffer) {
    if (buffer) {
      this.buffer = buffer;
      this.bufferDuration = buffer.duration;
      return this;
    } else {
      throw new Error("Buffer setting error");
    }
  },
  setGain: function(gain) {
    if (gain) {
      this.gain = gain;
      this.gainNode.gain.value = gain * gain;
      return this;
    } else {
      throw new Error("Gain setting error");
    }
  },
  setSpeed: function(val) {
    if (val) {
      this.speed = val;
      if (this.source)
        this.source.playbackRate.value = this.speed;
      return this;
    } else {
      throw new Error("Speed setting error");
    }
  },
  enableLoop: function(bool) {
    this.loop = bool;
    if (this.status !== this.IS_STOPPED) {
      this.source.loop = this.loop;
    }
    return this;
  },
  start: function() {
    if (this.status !== this.IS_PLAYING) {
      this.startedAtTime = audioContext.currentTime;
      this.source = audioContext.createBufferSource();
      this.source.buffer = this.buffer;
      this.source.playbackRate.value = this.speed;
      this.source.loop = this.loop;
      this.source.connect(this.gainNode);
      var offset = this.startPosition % this.buffer.duration;
      this.source.start(0, offset);
      this.status = this.IS_PLAYING;
      this.setOnendedCallback();
      return offset;
    } else {}
  },
  stop: function() {
    if (this.status === this.IS_PLAYING) {
      this.source.stop(0);
    }
    if (this.status !== this.IS_STOPPED) {
      this.status = this.IS_STOPPED;
      this.startPosition = 0;
      return this.startPosition;
    } else {}
  },
  pause: function() {
    if (this.status === this.IS_PLAYING) {
      this.status = this.IS_PAUSED;
      this.source.stop(0);
      this.startPosition = this.startPosition + this.getElapsedDuration();
      return this.startPosition;
    } else {}
  },
  seek: function(pos) {
    if (this.status === this.IS_PLAYING) {
      this.stop();
      this.startPosition = pos % this.bufferDuration;
      this.start();
    } else {
      this.startPosition = pos % this.bufferDuration;
    }
    return this.startPosition;
  },
  getStatus: function() {
    return this.status;
  },
  getElapsedDuration: function() {
    return audioContext.currentTime - this.startedAtTime;
  },
  setOnendedCallback: function() {
    var that = this;
    this.source.onended = function() {
      if ((that.status !== that.IS_PAUSED) && (that.getElapsedDuration() + that.startPosition > that.bufferDuration)) {
        if (!that.loop) {
          that.status = that.IS_STOPPED;
          that.startPosition = 0;
        }
        that.emit("ended", that.startPosition);
      }
    };
  }
}, {}, events.EventEmitter);
module.exports = Player;


//# sourceURL=/Users/goldszmidt/sam/pro/dev/player/player.es6.js
},{"audio-context":2,"events":4}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9hdWRpby1jb250ZXh0L2FjLW1vbmtleXBhdGNoLmpzIiwibm9kZV9tb2R1bGVzL2F1ZGlvLWNvbnRleHQvYXVkaW8tY29udGV4dC5qcyIsIi9Vc2Vycy9nb2xkc3ptaWR0L3NhbS9wcm8vZGV2L3BsYXllci9wbGF5ZXIuZXM2LmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIENvcHlyaWdodCAyMDEzIENocmlzIFdpbHNvblxuXG4gICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuICAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8qIFxuXG5UaGlzIG1vbmtleXBhdGNoIGxpYnJhcnkgaXMgaW50ZW5kZWQgdG8gYmUgaW5jbHVkZWQgaW4gcHJvamVjdHMgdGhhdCBhcmVcbndyaXR0ZW4gdG8gdGhlIHByb3BlciBBdWRpb0NvbnRleHQgc3BlYyAoaW5zdGVhZCBvZiB3ZWJraXRBdWRpb0NvbnRleHQpLCBcbmFuZCB0aGF0IHVzZSB0aGUgbmV3IG5hbWluZyBhbmQgcHJvcGVyIGJpdHMgb2YgdGhlIFdlYiBBdWRpbyBBUEkgKGUuZy4gXG51c2luZyBCdWZmZXJTb3VyY2VOb2RlLnN0YXJ0KCkgaW5zdGVhZCBvZiBCdWZmZXJTb3VyY2VOb2RlLm5vdGVPbigpKSwgYnV0IG1heVxuaGF2ZSB0byBydW4gb24gc3lzdGVtcyB0aGF0IG9ubHkgc3VwcG9ydCB0aGUgZGVwcmVjYXRlZCBiaXRzLlxuXG5UaGlzIGxpYnJhcnkgc2hvdWxkIGJlIGhhcm1sZXNzIHRvIGluY2x1ZGUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgXG51bnByZWZpeGVkIFwiQXVkaW9Db250ZXh0XCIsIGFuZC9vciBpZiBpdCBzdXBwb3J0cyB0aGUgbmV3IG5hbWVzLiAgXG5cblRoZSBwYXRjaGVzIHRoaXMgbGlicmFyeSBoYW5kbGVzOlxuaWYgd2luZG93LkF1ZGlvQ29udGV4dCBpcyB1bnN1cHBvcnRlZCwgaXQgd2lsbCBiZSBhbGlhc2VkIHRvIHdlYmtpdEF1ZGlvQ29udGV4dCgpLlxuaWYgQXVkaW9CdWZmZXJTb3VyY2VOb2RlLnN0YXJ0KCkgaXMgdW5pbXBsZW1lbnRlZCwgaXQgd2lsbCBiZSByb3V0ZWQgdG8gbm90ZU9uKCkgb3Jcbm5vdGVHcmFpbk9uKCksIGRlcGVuZGluZyBvbiBwYXJhbWV0ZXJzLlxuXG5UaGUgZm9sbG93aW5nIGFsaWFzZXMgb25seSB0YWtlIGVmZmVjdCBpZiB0aGUgbmV3IG5hbWVzIGFyZSBub3QgYWxyZWFkeSBpbiBwbGFjZTpcblxuQXVkaW9CdWZmZXJTb3VyY2VOb2RlLnN0b3AoKSBpcyBhbGlhc2VkIHRvIG5vdGVPZmYoKVxuQXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKSBpcyBhbGlhc2VkIHRvIGNyZWF0ZUdhaW5Ob2RlKClcbkF1ZGlvQ29udGV4dC5jcmVhdGVEZWxheSgpIGlzIGFsaWFzZWQgdG8gY3JlYXRlRGVsYXlOb2RlKClcbkF1ZGlvQ29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoKSBpcyBhbGlhc2VkIHRvIGNyZWF0ZUphdmFTY3JpcHROb2RlKClcbkF1ZGlvQ29udGV4dC5jcmVhdGVQZXJpb2RpY1dhdmUoKSBpcyBhbGlhc2VkIHRvIGNyZWF0ZVdhdmVUYWJsZSgpXG5Pc2NpbGxhdG9yTm9kZS5zdGFydCgpIGlzIGFsaWFzZWQgdG8gbm90ZU9uKClcbk9zY2lsbGF0b3JOb2RlLnN0b3AoKSBpcyBhbGlhc2VkIHRvIG5vdGVPZmYoKVxuT3NjaWxsYXRvck5vZGUuc2V0UGVyaW9kaWNXYXZlKCkgaXMgYWxpYXNlZCB0byBzZXRXYXZlVGFibGUoKVxuQXVkaW9QYXJhbS5zZXRUYXJnZXRBdFRpbWUoKSBpcyBhbGlhc2VkIHRvIHNldFRhcmdldFZhbHVlQXRUaW1lKClcblxuVGhpcyBsaWJyYXJ5IGRvZXMgTk9UIHBhdGNoIHRoZSBlbnVtZXJhdGVkIHR5cGUgY2hhbmdlcywgYXMgaXQgaXMgXG5yZWNvbW1lbmRlZCBpbiB0aGUgc3BlY2lmaWNhdGlvbiB0aGF0IGltcGxlbWVudGF0aW9ucyBzdXBwb3J0IGJvdGggaW50ZWdlclxuYW5kIHN0cmluZyB0eXBlcyBmb3IgQXVkaW9QYW5uZXJOb2RlLnBhbm5pbmdNb2RlbCwgQXVkaW9QYW5uZXJOb2RlLmRpc3RhbmNlTW9kZWwgXG5CaXF1YWRGaWx0ZXJOb2RlLnR5cGUgYW5kIE9zY2lsbGF0b3JOb2RlLnR5cGUuXG5cbiovXG4oZnVuY3Rpb24gKGdsb2JhbCwgZXhwb3J0cywgcGVyZikge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gZml4U2V0VGFyZ2V0KHBhcmFtKSB7XG4gICAgaWYgKCFwYXJhbSkgLy8gaWYgTllJLCBqdXN0IHJldHVyblxuICAgICAgcmV0dXJuO1xuICAgIGlmICghcGFyYW0uc2V0VGFyZ2V0QXRUaW1lKVxuICAgICAgcGFyYW0uc2V0VGFyZ2V0QXRUaW1lID0gcGFyYW0uc2V0VGFyZ2V0VmFsdWVBdFRpbWU7IFxuICB9XG5cbiAgaWYgKHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnd2Via2l0QXVkaW9Db250ZXh0JykgJiYgXG4gICAgICAhd2luZG93Lmhhc093blByb3BlcnR5KCdBdWRpb0NvbnRleHQnKSkge1xuICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3ZWJraXRBdWRpb0NvbnRleHQ7XG5cbiAgICBpZiAoIUF1ZGlvQ29udGV4dC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkoJ2NyZWF0ZUdhaW4nKSlcbiAgICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlR2FpbiA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlR2Fpbk5vZGU7XG4gICAgaWYgKCFBdWRpb0NvbnRleHQucHJvdG90eXBlLmhhc093blByb3BlcnR5KCdjcmVhdGVEZWxheScpKVxuICAgICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5jcmVhdGVEZWxheSA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlRGVsYXlOb2RlO1xuICAgIGlmICghQXVkaW9Db250ZXh0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnY3JlYXRlU2NyaXB0UHJvY2Vzc29yJykpXG4gICAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZVNjcmlwdFByb2Nlc3NvciA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlSmF2YVNjcmlwdE5vZGU7XG4gICAgaWYgKCFBdWRpb0NvbnRleHQucHJvdG90eXBlLmhhc093blByb3BlcnR5KCdjcmVhdGVQZXJpb2RpY1dhdmUnKSlcbiAgICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlUGVyaW9kaWNXYXZlID0gQXVkaW9Db250ZXh0LnByb3RvdHlwZS5jcmVhdGVXYXZlVGFibGU7XG5cblxuICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuaW50ZXJuYWxfY3JlYXRlR2FpbiA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlR2FpbjtcbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUdhaW4gPSBmdW5jdGlvbigpIHsgXG4gICAgICB2YXIgbm9kZSA9IHRoaXMuaW50ZXJuYWxfY3JlYXRlR2FpbigpO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUuZ2Fpbik7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4gICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5pbnRlcm5hbF9jcmVhdGVEZWxheSA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlRGVsYXk7XG4gICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5jcmVhdGVEZWxheSA9IGZ1bmN0aW9uKG1heERlbGF5VGltZSkgeyBcbiAgICAgIHZhciBub2RlID0gbWF4RGVsYXlUaW1lID8gdGhpcy5pbnRlcm5hbF9jcmVhdGVEZWxheShtYXhEZWxheVRpbWUpIDogdGhpcy5pbnRlcm5hbF9jcmVhdGVEZWxheSgpO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUuZGVsYXlUaW1lKTtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmludGVybmFsX2NyZWF0ZUJ1ZmZlclNvdXJjZSA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlO1xuICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7IFxuICAgICAgdmFyIG5vZGUgPSB0aGlzLmludGVybmFsX2NyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgaWYgKCFub2RlLnN0YXJ0KSB7XG4gICAgICAgIG5vZGUuc3RhcnQgPSBmdW5jdGlvbiAoIHdoZW4sIG9mZnNldCwgZHVyYXRpb24gKSB7XG4gICAgICAgICAgaWYgKCBvZmZzZXQgfHwgZHVyYXRpb24gKVxuICAgICAgICAgICAgdGhpcy5ub3RlR3JhaW5Pbiggd2hlbiwgb2Zmc2V0LCBkdXJhdGlvbiApO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMubm90ZU9uKCB3aGVuICk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBpZiAoIW5vZGUuc3RvcClcbiAgICAgICAgbm9kZS5zdG9wID0gbm9kZS5ub3RlT2ZmO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUucGxheWJhY2tSYXRlKTtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmludGVybmFsX2NyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvciA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlRHluYW1pY3NDb21wcmVzc29yO1xuICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlRHluYW1pY3NDb21wcmVzc29yID0gZnVuY3Rpb24oKSB7IFxuICAgICAgdmFyIG5vZGUgPSB0aGlzLmludGVybmFsX2NyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUudGhyZXNob2xkKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLmtuZWUpO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUucmF0aW8pO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUucmVkdWN0aW9uKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLmF0dGFjayk7XG4gICAgICBmaXhTZXRUYXJnZXQobm9kZS5yZWxlYXNlKTtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmludGVybmFsX2NyZWF0ZUJpcXVhZEZpbHRlciA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlQmlxdWFkRmlsdGVyO1xuICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlQmlxdWFkRmlsdGVyID0gZnVuY3Rpb24oKSB7IFxuICAgICAgdmFyIG5vZGUgPSB0aGlzLmludGVybmFsX2NyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUuZnJlcXVlbmN5KTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLmRldHVuZSk7XG4gICAgICBmaXhTZXRUYXJnZXQobm9kZS5RKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLmdhaW4pO1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfTtcblxuICAgIGlmIChBdWRpb0NvbnRleHQucHJvdG90eXBlLmhhc093blByb3BlcnR5KCAnY3JlYXRlT3NjaWxsYXRvcicgKSkge1xuICAgICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5pbnRlcm5hbF9jcmVhdGVPc2NpbGxhdG9yID0gQXVkaW9Db250ZXh0LnByb3RvdHlwZS5jcmVhdGVPc2NpbGxhdG9yO1xuICAgICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5jcmVhdGVPc2NpbGxhdG9yID0gZnVuY3Rpb24oKSB7IFxuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuaW50ZXJuYWxfY3JlYXRlT3NjaWxsYXRvcigpO1xuICAgICAgICBpZiAoIW5vZGUuc3RhcnQpXG4gICAgICAgICAgbm9kZS5zdGFydCA9IG5vZGUubm90ZU9uOyBcbiAgICAgICAgaWYgKCFub2RlLnN0b3ApXG4gICAgICAgICAgbm9kZS5zdG9wID0gbm9kZS5ub3RlT2ZmO1xuICAgICAgICBpZiAoIW5vZGUuc2V0UGVyaW9kaWNXYXZlKVxuICAgICAgICAgIG5vZGUuc2V0UGVyaW9kaWNXYXZlID0gbm9kZS5zZXRXYXZlVGFibGU7XG4gICAgICAgIGZpeFNldFRhcmdldChub2RlLmZyZXF1ZW5jeSk7XG4gICAgICAgIGZpeFNldFRhcmdldChub2RlLmRldHVuZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbn0od2luZG93KSk7IiwiLypnbG9iYWxzIEF1ZGlvQ29udGV4dCovXG5yZXF1aXJlKCcuL2FjLW1vbmtleXBhdGNoJyk7XG53aW5kb3cud2F2ZXMgPSB3aW5kb3cud2F2ZXMgfHwge307XG5tb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy53YXZlcy5hdWRpb0NvbnRleHQgPSB3aW5kb3cud2F2ZXMuYXVkaW9Db250ZXh0IHx8IG5ldyBBdWRpb0NvbnRleHQoKTsiLCIvKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIFdBVkUgYXVkaW8gbGlicmFyeSBtb2R1bGUgZm9yIGJ1ZmZlciBwbGF5aW5nLlxuICogQ2F1dGlvbjogc3BlZWQgY2hhbmdlcyBtYXkgaGFybSBzdGF0ZSBoYW5kbGluZy5cbiAqIEBhdXRob3IgS2FyaW0gQmFya2F0aVxuICogQHZlcnNpb24gMS4yLjJcbiAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGF1ZGlvQ29udGV4dCA9IHJlcXVpcmUoXCJhdWRpby1jb250ZXh0XCIpOyAvL21ha2UgYW4gQXVkaW9Db250ZXh0IGluc3RhbmNlIGdsb2JhbGx5IGF2YWlsYWJsZVxudmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5jbGFzcyBQbGF5ZXIgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICBjb25zdHJ1Y3RvcihidWZmZXIpIHtcbiAgICAvLyBwcml2YXRlIHByb3BlcnRpZXNcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhQbGF5ZXIucHJvdG90eXBlLCB7XG4gICAgICBzb3VyY2U6IHtcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0sXG4gICAgICBidWZmZXI6IHtcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0sXG4gICAgICBnYWluTm9kZToge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIG91dHB1dE5vZGU6IHtcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0sXG4gICAgICBzcGVlZDoge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IDFcbiAgICAgIH0sXG4gICAgICBnYWluOiB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9LFxuICAgICAgbG9vcDoge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IGZhbHNlXG4gICAgICB9LFxuXG4gICAgICAvLyBGb3IgcmVzdW1pbmcgYWZ0ZXIgcGF1c2VcbiAgICAgIHN0YXJ0UG9zaXRpb246IHtcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAwXG4gICAgICB9LFxuICAgICAgc3RhcnRlZEF0VGltZToge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IDBcbiAgICAgIH0sXG5cbiAgICAgIC8vIFBsYXllciBzdGF0dXNcbiAgICAgIElTX1BMQVlJTkc6IHtcbiAgICAgICAgdmFsdWU6IFwiaXNfcGxheWluZ1wiXG4gICAgICB9LFxuICAgICAgSVNfUEFVU0VEOiB7XG4gICAgICAgIHZhbHVlOiBcImlzX3BhdXNlZFwiXG4gICAgICB9LFxuICAgICAgSVNfU1RPUFBFRDoge1xuICAgICAgICB2YWx1ZTogXCJpc19zdG9wcGVkXCJcbiAgICAgIH0sXG4gICAgICBzdGF0dXM6IHtcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE1hbmRhdG9yeSBpbml0aWFsaXphdGlvbiBtZXRob2QuXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKi9cbiAgICB0aGlzLnN0YXR1cyA9IHRoaXMuSVNfU1RPUFBFRDtcblxuICAgIGlmIChidWZmZXIpIHtcbiAgICAgIHRoaXMuc2V0QnVmZmVyKGJ1ZmZlcik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHdlYiBhdWRpbyBub2RlcywgcmVseWluZyBvbiB0aGUgZ2l2ZW4gYXVkaW8gY29udGV4dC5cbiAgICB0aGlzLmdhaW5Ob2RlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICB0aGlzLm91dHB1dE5vZGUgPSBhdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpOyAvLyBkdW1teSBub2RlIHRvIHByb3ZpZGUgYSB3ZWIgYXVkaW8tbGlrZSBvdXRwdXQgbm9kZVxuXG4gICAgLy8gdGhpcy5vbignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKFwiQXVkaW8gcGxheWluZyBlbmRlZC5cIik7XG4gICAgLy8gfSk7XG4gICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgfVxuXG4gIC8qKlxuICAgKiBXZWIgYXVkaW8gQVBJLWxpa2UgY29ubmVjdCBtZXRob2QuXG4gICAqIEBwdWJsaWNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY29ubmVjdCh0YXJnZXQpIHtcbiAgICB0aGlzLm91dHB1dE5vZGUgPSB0YXJnZXQ7XG4gICAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMub3V0cHV0Tm9kZSB8fCBhdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgIHJldHVybiB0aGlzOyAvLyBmb3IgY2hhaW5hYmlsaXR5XG4gIH1cblxuICAvKipcbiAgICogV2ViIGF1ZGlvIEFQSS1saWtlIGRpc2Nvbm5lY3QgbWV0aG9kLlxuICAgKiBAcHVibGljXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIGRpc2Nvbm5lY3Qob3V0cHV0KSB7XG4gICAgdGhpcy5nYWluTm9kZS5kaXNjb25uZWN0KG91dHB1dCk7XG4gICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYnVmZmVyIGFuZCBidWZmZXJEdXJhdGlvbi5cbiAgICogQHB1YmxpY1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgaWYgKGJ1ZmZlcikge1xuICAgICAgdGhpcy5idWZmZXIgPSBidWZmZXI7XG4gICAgICB0aGlzLmJ1ZmZlckR1cmF0aW9uID0gYnVmZmVyLmR1cmF0aW9uO1xuICAgICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQnVmZmVyIHNldHRpbmcgZXJyb3JcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBnYWluIHZhbHVlIGFuZCBzcXVhcmVkIHZvbHVtZS5cbiAgICogQHB1YmxpY1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXRHYWluKGdhaW4pIHtcbiAgICBpZiAoZ2Fpbikge1xuICAgICAgdGhpcy5nYWluID0gZ2FpbjtcbiAgICAgIC8vIExldCdzIHVzZSBhbiB4LXNxdWFyZWQgY3VydmUgc2luY2Ugc2ltcGxlIGxpbmVhciAoeCkgZG9lcyBub3Qgc291bmQgYXMgZ29vZC5cbiAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IGdhaW4gKiBnYWluO1xuICAgICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2FpbiBzZXR0aW5nIGVycm9yXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgcGxheWJhY2sgc3BlZWQuXG4gICAqIEBwdWJsaWNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgc2V0U3BlZWQodmFsKSB7XG4gICAgaWYgKHZhbCkge1xuICAgICAgdGhpcy5zcGVlZCA9IHZhbDtcbiAgICAgIGlmICh0aGlzLnNvdXJjZSlcbiAgICAgICAgdGhpcy5zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gdGhpcy5zcGVlZDtcbiAgICAgIHJldHVybiB0aGlzOyAvLyBmb3IgY2hhaW5hYmlsaXR5XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNwZWVkIHNldHRpbmcgZXJyb3JcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBvciBkaXNhYmxlIGxvb3BpbmcgcGxheWJhY2suXG4gICAqIEBwdWJsaWNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZW5hYmxlTG9vcChib29sKSB7XG4gICAgdGhpcy5sb29wID0gYm9vbDtcbiAgICBpZiAodGhpcy5zdGF0dXMgIT09IHRoaXMuSVNfU1RPUFBFRCkge1xuICAgICAgdGhpcy5zb3VyY2UubG9vcCA9IHRoaXMubG9vcDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCBwbGF5aW5nLlxuICAgKiBAcHVibGljXG4gICAqL1xuICBzdGFydCgpIHtcbiAgICAvLyBMb2NrIHBsYXlpbmcgdG8gYXZvaWQgbXVsdGlwbGUgc291cmNlcyBjcmVhdGlvbi5cbiAgICBpZiAodGhpcy5zdGF0dXMgIT09IHRoaXMuSVNfUExBWUlORykge1xuICAgICAgLy8gQ29uZmlndXJlIGEgQnVmZmVyU291cmNlLlxuICAgICAgdGhpcy5zdGFydGVkQXRUaW1lID0gYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lO1xuICAgICAgdGhpcy5zb3VyY2UgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICB0aGlzLnNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgIHRoaXMuc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHRoaXMuc3BlZWQ7XG4gICAgICB0aGlzLnNvdXJjZS5sb29wID0gdGhpcy5sb29wO1xuICAgICAgdGhpcy5zb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcblxuICAgICAgLy8gUmVzdW1lIGJ1dCBtYWtlIHN1cmUgd2Ugc3RheSBpbiBib3VuZCBvZiB0aGUgYnVmZmVyLlxuICAgICAgdmFyIG9mZnNldCA9IHRoaXMuc3RhcnRQb3NpdGlvbiAlIHRoaXMuYnVmZmVyLmR1cmF0aW9uO1xuICAgICAgdGhpcy5zb3VyY2Uuc3RhcnQoMCwgb2Zmc2V0KTsgLy8gb3B0aW9uYWwgM3JkIGFyZ3VtZW50IGFzIGR1cmF0aW9uXG4gICAgICB0aGlzLnN0YXR1cyA9IHRoaXMuSVNfUExBWUlORztcblxuICAgICAgdGhpcy5zZXRPbmVuZGVkQ2FsbGJhY2soKTtcblxuICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZyhcIkFscmVhZHkgcGxheWluZy5cIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgcGxheWluZy5cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5zdGF0dXMgPT09IHRoaXMuSVNfUExBWUlORykge1xuICAgICAgdGhpcy5zb3VyY2Uuc3RvcCgwKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdHVzICE9PSB0aGlzLklTX1NUT1BQRUQpIHtcbiAgICAgIHRoaXMuc3RhdHVzID0gdGhpcy5JU19TVE9QUEVEO1xuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gMDtcbiAgICAgIHJldHVybiB0aGlzLnN0YXJ0UG9zaXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vY29uc29sZS5sb2coXCJBbHJlYWR5IHN0b3BwZWQuXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXVzZSBwbGF5aW5nLlxuICAgKiBAcHVibGljXG4gICAqL1xuICBwYXVzZSgpIHtcbiAgICBpZiAodGhpcy5zdGF0dXMgPT09IHRoaXMuSVNfUExBWUlORykge1xuICAgICAgdGhpcy5zdGF0dXMgPSB0aGlzLklTX1BBVVNFRDtcbiAgICAgIHRoaXMuc291cmNlLnN0b3AoMCk7XG4gICAgICAvLyBNZWFzdXJlIGhvdyBtdWNoIHRpbWUgcGFzc2VkIHNpbmNlIHRoZSBsYXN0IHBhdXNlLlxuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gdGhpcy5zdGFydFBvc2l0aW9uICsgdGhpcy5nZXRFbGFwc2VkRHVyYXRpb24oKTtcblxuICAgICAgcmV0dXJuIHRoaXMuc3RhcnRQb3NpdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZyhcIk5vdCBwbGF5aW5nLlwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VlayBidWZmZXIgcG9zaXRpb24gKGluIHNlYykuXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHNlZWsocG9zKSB7XG4gICAgaWYgKHRoaXMuc3RhdHVzID09PSB0aGlzLklTX1BMQVlJTkcpIHtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gcG9zICUgdGhpcy5idWZmZXJEdXJhdGlvbjtcbiAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gcG9zICUgdGhpcy5idWZmZXJEdXJhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3RhcnRQb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcGxheWVyIHN0YXR1cy5cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZ2V0U3RhdHVzKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGVsYXBzZWQgZHVyYXRpb24gc2luY2UgcHJldmlvdXMgcG9zaXRpb24gY2hhbmdlLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAdG9kbyBIYW5kbGUgc3BlZWQgY2hhbmdlcy5cbiAgICovXG4gIGdldEVsYXBzZWREdXJhdGlvbigpIHtcbiAgICByZXR1cm4gYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lIC0gdGhpcy5zdGFydGVkQXRUaW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2UgcGxheWluZyBmbGFnIHdoZW4gdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQuXG4gICAqIEBwcml2YXRlXG4gICAqIEB0b2RvIEhhbmRsZSBzcGVlZCBjaGFuZ2VzLlxuICAgKi9cbiAgc2V0T25lbmRlZENhbGxiYWNrKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAvLyBSZWxlYXNlIHNvdXJjZSBwbGF5aW5nIGZsYWcgd2hlbiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZC5cbiAgICAvLyBJc3N1ZTogdGhlIGV2ZW50IGNvbWVzIGxhdGUgYW5kIGlzIGVtaXR0ZWQgb24gZXZlcnkgc291cmNlLnN0b3AoKSxcbiAgICAvLyBzbyBpdCBpcyBuZWNlc3NhcnkgdG8gY2hlY2sgZWxhcHNlZCBkdXJhdGlvbixcbiAgICAvLyBidXQgc3BlZWQgY2hhbmdlcyBjYW4gbWVzcyBpdCB1cC4uLlxuICAgIHRoaXMuc291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIC8vY29uc29sZS5sb2coXCJFbGFwc2VkIGR1cmF0aW9uIG9uIFxcJ2VuZGVkXFwnIGV2ZW50OlwiLFxuICAgICAgLy8gIHRoYXQuZ2V0RWxhcHNlZER1cmF0aW9uKCkgKyB0aGF0LnN0YXJ0UG9zaXRpb24sXG4gICAgICAvLyAgXCJzZWNcIik7XG4gICAgICBpZiAoKHRoYXQuc3RhdHVzICE9PSB0aGF0LklTX1BBVVNFRCkgJiYgKHRoYXQuZ2V0RWxhcHNlZER1cmF0aW9uKCkgKyB0aGF0LnN0YXJ0UG9zaXRpb24gPiB0aGF0LmJ1ZmZlckR1cmF0aW9uKSkge1xuICAgICAgICBpZiAoIXRoYXQubG9vcCkge1xuICAgICAgICAgIHRoYXQuc3RhdHVzID0gdGhhdC5JU19TVE9QUEVEO1xuICAgICAgICAgIHRoYXQuc3RhcnRQb3NpdGlvbiA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0LmVtaXQoXCJlbmRlZFwiLCB0aGF0LnN0YXJ0UG9zaXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBDb21tb25KUyBmdW5jdGlvbiBleHBvcnRcbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
