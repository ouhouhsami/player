!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Player=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var events = require('events');
var Player = function Player(buffer, options) {
  this.audioContext = options.audioContext;
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
  this.gainNode = this.audioContext.createGain();
  this.outputNode = this.audioContext.createGain();
  return this;
};
var $Player = Player;
($traceurRuntime.createClass)(Player, {
  connect: function(target) {
    this.outputNode = target;
    this.gainNode.connect(this.outputNode || this.audioContext.destination);
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
      this.startedAtTime = this.audioContext.currentTime;
      this.source = this.audioContext.createBufferSource();
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
    return this.audioContext.currentTime - this.startedAtTime;
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
},{"events":2}],2:[function(require,module,exports){
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9nb2xkc3ptaWR0L3NhbS9wcm8vZGV2L3BsYXllci9wbGF5ZXIuZXM2LmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ1FBO0FBQUEsQUFBSSxFQUFBLENBQUEsTUFBSyxFQUFJLENBQUEsT0FBTSxBQUFDLENBQUMsUUFBTyxDQUFDLENBQUM7QUFSOUIsQUFBSSxFQUFBLFNBVUosU0FBTSxPQUFLLENBRUcsTUFBSyxDQUFHLENBQUEsT0FBTSxDQUFHO0FBQzNCLEtBQUcsYUFBYSxFQUFJLENBQUEsT0FBTSxhQUFhLENBQUM7QUFFeEMsT0FBSyxpQkFBaUIsQUFBQyxDQUFDLGlCQUFlLENBQUc7QUFDeEMsU0FBSyxDQUFHLEVBQ04sUUFBTyxDQUFHLEtBQUcsQ0FDZjtBQUNBLFNBQUssQ0FBRyxFQUNOLFFBQU8sQ0FBRyxLQUFHLENBQ2Y7QUFDQSxXQUFPLENBQUcsRUFDUixRQUFPLENBQUcsS0FBRyxDQUNmO0FBQ0EsYUFBUyxDQUFHLEVBQ1YsUUFBTyxDQUFHLEtBQUcsQ0FDZjtBQUNBLFFBQUksQ0FBRztBQUNMLGFBQU8sQ0FBRyxLQUFHO0FBQ2IsVUFBSSxDQUFHLEVBQUE7QUFBQSxJQUNUO0FBQ0EsT0FBRyxDQUFHLEVBQ0osUUFBTyxDQUFHLEtBQUcsQ0FDZjtBQUNBLE9BQUcsQ0FBRztBQUNKLGFBQU8sQ0FBRyxLQUFHO0FBQ2IsVUFBSSxDQUFHLE1BQUk7QUFBQSxJQUNiO0FBR0EsZ0JBQVksQ0FBRztBQUNiLGFBQU8sQ0FBRyxLQUFHO0FBQ2IsVUFBSSxDQUFHLEVBQUE7QUFBQSxJQUNUO0FB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBXQVZFIGF1ZGlvIGxpYnJhcnkgbW9kdWxlIGZvciBidWZmZXIgcGxheWluZy5cbiAqIENhdXRpb246IHNwZWVkIGNoYW5nZXMgbWF5IGhhcm0gc3RhdGUgaGFuZGxpbmcuXG4gKiBAYXV0aG9yIEthcmltIEJhcmthdGlcbiAqIEB2ZXJzaW9uIDEuMi4yXG4gKi9cblxudmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5jbGFzcyBQbGF5ZXIgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICBjb25zdHJ1Y3RvcihidWZmZXIsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG9wdGlvbnMuYXVkaW9Db250ZXh0O1xuICAgIC8vIHByaXZhdGUgcHJvcGVydGllc1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFBsYXllci5wcm90b3R5cGUsIHtcbiAgICAgIHNvdXJjZToge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGJ1ZmZlcjoge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGdhaW5Ob2RlOiB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9LFxuICAgICAgb3V0cHV0Tm9kZToge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIHNwZWVkOiB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogMVxuICAgICAgfSxcbiAgICAgIGdhaW46IHtcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0sXG4gICAgICBsb29wOiB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogZmFsc2VcbiAgICAgIH0sXG5cbiAgICAgIC8vIEZvciByZXN1bWluZyBhZnRlciBwYXVzZVxuICAgICAgc3RhcnRQb3NpdGlvbjoge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IDBcbiAgICAgIH0sXG4gICAgICBzdGFydGVkQXRUaW1lOiB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogMFxuICAgICAgfSxcblxuICAgICAgLy8gUGxheWVyIHN0YXR1c1xuICAgICAgSVNfUExBWUlORzoge1xuICAgICAgICB2YWx1ZTogXCJpc19wbGF5aW5nXCJcbiAgICAgIH0sXG4gICAgICBJU19QQVVTRUQ6IHtcbiAgICAgICAgdmFsdWU6IFwiaXNfcGF1c2VkXCJcbiAgICAgIH0sXG4gICAgICBJU19TVE9QUEVEOiB7XG4gICAgICAgIHZhbHVlOiBcImlzX3N0b3BwZWRcIlxuICAgICAgfSxcbiAgICAgIHN0YXR1czoge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTWFuZGF0b3J5IGluaXRpYWxpemF0aW9uIG1ldGhvZC5cbiAgICAgKiBAcHVibGljXG4gICAgICogQGNoYWluYWJsZVxuICAgICAqL1xuICAgIHRoaXMuc3RhdHVzID0gdGhpcy5JU19TVE9QUEVEO1xuXG4gICAgaWYgKGJ1ZmZlcikge1xuICAgICAgdGhpcy5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgd2ViIGF1ZGlvIG5vZGVzLCByZWx5aW5nIG9uIHRoZSBnaXZlbiBhdWRpbyBjb250ZXh0LlxuICAgIHRoaXMuZ2Fpbk5vZGUgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgdGhpcy5vdXRwdXROb2RlID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpOyAvLyBkdW1teSBub2RlIHRvIHByb3ZpZGUgYSB3ZWIgYXVkaW8tbGlrZSBvdXRwdXQgbm9kZVxuXG4gICAgLy8gdGhpcy5vbignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKFwiQXVkaW8gcGxheWluZyBlbmRlZC5cIik7XG4gICAgLy8gfSk7XG4gICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgfVxuXG4gIC8qKlxuICAgKiBXZWIgYXVkaW8gQVBJLWxpa2UgY29ubmVjdCBtZXRob2QuXG4gICAqIEBwdWJsaWNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgY29ubmVjdCh0YXJnZXQpIHtcbiAgICB0aGlzLm91dHB1dE5vZGUgPSB0YXJnZXQ7XG4gICAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMub3V0cHV0Tm9kZSB8fCB0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgfVxuXG4gIC8qKlxuICAgKiBXZWIgYXVkaW8gQVBJLWxpa2UgZGlzY29ubmVjdCBtZXRob2QuXG4gICAqIEBwdWJsaWNcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgZGlzY29ubmVjdChvdXRwdXQpIHtcbiAgICB0aGlzLmdhaW5Ob2RlLmRpc2Nvbm5lY3Qob3V0cHV0KTtcbiAgICByZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluYWJpbGl0eVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBidWZmZXIgYW5kIGJ1ZmZlckR1cmF0aW9uLlxuICAgKiBAcHVibGljXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBpZiAoYnVmZmVyKSB7XG4gICAgICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgIHRoaXMuYnVmZmVyRHVyYXRpb24gPSBidWZmZXIuZHVyYXRpb247XG4gICAgICByZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluYWJpbGl0eVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdWZmZXIgc2V0dGluZyBlcnJvclwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IGdhaW4gdmFsdWUgYW5kIHNxdWFyZWQgdm9sdW1lLlxuICAgKiBAcHVibGljXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIHNldEdhaW4oZ2Fpbikge1xuICAgIGlmIChnYWluKSB7XG4gICAgICB0aGlzLmdhaW4gPSBnYWluO1xuICAgICAgLy8gTGV0J3MgdXNlIGFuIHgtc3F1YXJlZCBjdXJ2ZSBzaW5jZSBzaW1wbGUgbGluZWFyICh4KSBkb2VzIG5vdCBzb3VuZCBhcyBnb29kLlxuICAgICAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gZ2FpbiAqIGdhaW47XG4gICAgICByZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluYWJpbGl0eVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHYWluIHNldHRpbmcgZXJyb3JcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBwbGF5YmFjayBzcGVlZC5cbiAgICogQHB1YmxpY1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBzZXRTcGVlZCh2YWwpIHtcbiAgICBpZiAodmFsKSB7XG4gICAgICB0aGlzLnNwZWVkID0gdmFsO1xuICAgICAgaWYgKHRoaXMuc291cmNlKVxuICAgICAgICB0aGlzLnNvdXJjZS5wbGF5YmFja1JhdGUudmFsdWUgPSB0aGlzLnNwZWVkO1xuICAgICAgcmV0dXJuIHRoaXM7IC8vIGZvciBjaGFpbmFiaWxpdHlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3BlZWQgc2V0dGluZyBlcnJvclwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIG9yIGRpc2FibGUgbG9vcGluZyBwbGF5YmFjay5cbiAgICogQHB1YmxpY1xuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBlbmFibGVMb29wKGJvb2wpIHtcbiAgICB0aGlzLmxvb3AgPSBib29sO1xuICAgIGlmICh0aGlzLnN0YXR1cyAhPT0gdGhpcy5JU19TVE9QUEVEKSB7XG4gICAgICB0aGlzLnNvdXJjZS5sb29wID0gdGhpcy5sb29wO1xuICAgIH1cbiAgICByZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluYWJpbGl0eVxuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHBsYXlpbmcuXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHN0YXJ0KCkge1xuICAgIC8vIExvY2sgcGxheWluZyB0byBhdm9pZCBtdWx0aXBsZSBzb3VyY2VzIGNyZWF0aW9uLlxuICAgIGlmICh0aGlzLnN0YXR1cyAhPT0gdGhpcy5JU19QTEFZSU5HKSB7XG4gICAgICAvLyBDb25maWd1cmUgYSBCdWZmZXJTb3VyY2UuXG4gICAgICB0aGlzLnN0YXJ0ZWRBdFRpbWUgPSB0aGlzLmF1ZGlvQ29udGV4dC5jdXJyZW50VGltZTtcbiAgICAgIHRoaXMuc291cmNlID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICB0aGlzLnNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgIHRoaXMuc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHRoaXMuc3BlZWQ7XG4gICAgICB0aGlzLnNvdXJjZS5sb29wID0gdGhpcy5sb29wO1xuICAgICAgdGhpcy5zb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcblxuICAgICAgLy8gUmVzdW1lIGJ1dCBtYWtlIHN1cmUgd2Ugc3RheSBpbiBib3VuZCBvZiB0aGUgYnVmZmVyLlxuICAgICAgdmFyIG9mZnNldCA9IHRoaXMuc3RhcnRQb3NpdGlvbiAlIHRoaXMuYnVmZmVyLmR1cmF0aW9uO1xuICAgICAgdGhpcy5zb3VyY2Uuc3RhcnQoMCwgb2Zmc2V0KTsgLy8gb3B0aW9uYWwgM3JkIGFyZ3VtZW50IGFzIGR1cmF0aW9uXG4gICAgICB0aGlzLnN0YXR1cyA9IHRoaXMuSVNfUExBWUlORztcblxuICAgICAgdGhpcy5zZXRPbmVuZGVkQ2FsbGJhY2soKTtcblxuICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZyhcIkFscmVhZHkgcGxheWluZy5cIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgcGxheWluZy5cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5zdGF0dXMgPT09IHRoaXMuSVNfUExBWUlORykge1xuICAgICAgdGhpcy5zb3VyY2Uuc3RvcCgwKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdHVzICE9PSB0aGlzLklTX1NUT1BQRUQpIHtcbiAgICAgIHRoaXMuc3RhdHVzID0gdGhpcy5JU19TVE9QUEVEO1xuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gMDtcbiAgICAgIHJldHVybiB0aGlzLnN0YXJ0UG9zaXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vY29uc29sZS5sb2coXCJBbHJlYWR5IHN0b3BwZWQuXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXVzZSBwbGF5aW5nLlxuICAgKiBAcHVibGljXG4gICAqL1xuICBwYXVzZSgpIHtcbiAgICBpZiAodGhpcy5zdGF0dXMgPT09IHRoaXMuSVNfUExBWUlORykge1xuICAgICAgdGhpcy5zdGF0dXMgPSB0aGlzLklTX1BBVVNFRDtcbiAgICAgIHRoaXMuc291cmNlLnN0b3AoMCk7XG4gICAgICAvLyBNZWFzdXJlIGhvdyBtdWNoIHRpbWUgcGFzc2VkIHNpbmNlIHRoZSBsYXN0IHBhdXNlLlxuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gdGhpcy5zdGFydFBvc2l0aW9uICsgdGhpcy5nZXRFbGFwc2VkRHVyYXRpb24oKTtcblxuICAgICAgcmV0dXJuIHRoaXMuc3RhcnRQb3NpdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZyhcIk5vdCBwbGF5aW5nLlwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VlayBidWZmZXIgcG9zaXRpb24gKGluIHNlYykuXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHNlZWsocG9zKSB7XG4gICAgaWYgKHRoaXMuc3RhdHVzID09PSB0aGlzLklTX1BMQVlJTkcpIHtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gcG9zICUgdGhpcy5idWZmZXJEdXJhdGlvbjtcbiAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGFydFBvc2l0aW9uID0gcG9zICUgdGhpcy5idWZmZXJEdXJhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3RhcnRQb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcGxheWVyIHN0YXR1cy5cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZ2V0U3RhdHVzKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlIGVsYXBzZWQgZHVyYXRpb24gc2luY2UgcHJldmlvdXMgcG9zaXRpb24gY2hhbmdlLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAdG9kbyBIYW5kbGUgc3BlZWQgY2hhbmdlcy5cbiAgICovXG4gIGdldEVsYXBzZWREdXJhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5hdWRpb0NvbnRleHQuY3VycmVudFRpbWUgLSB0aGlzLnN0YXJ0ZWRBdFRpbWU7XG4gIH1cblxuICAvKipcbiAgICogUmVsZWFzZSBwbGF5aW5nIGZsYWcgd2hlbiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZC5cbiAgICogQHByaXZhdGVcbiAgICogQHRvZG8gSGFuZGxlIHNwZWVkIGNoYW5nZXMuXG4gICAqL1xuICBzZXRPbmVuZGVkQ2FsbGJhY2soKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIC8vIFJlbGVhc2Ugc291cmNlIHBsYXlpbmcgZmxhZyB3aGVuIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLlxuICAgIC8vIElzc3VlOiB0aGUgZXZlbnQgY29tZXMgbGF0ZSBhbmQgaXMgZW1pdHRlZCBvbiBldmVyeSBzb3VyY2Uuc3RvcCgpLFxuICAgIC8vIHNvIGl0IGlzIG5lY2Vzc2FyeSB0byBjaGVjayBlbGFwc2VkIGR1cmF0aW9uLFxuICAgIC8vIGJ1dCBzcGVlZCBjaGFuZ2VzIGNhbiBtZXNzIGl0IHVwLi4uXG4gICAgdGhpcy5zb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy9jb25zb2xlLmxvZyhcIkVsYXBzZWQgZHVyYXRpb24gb24gXFwnZW5kZWRcXCcgZXZlbnQ6XCIsXG4gICAgICAvLyAgdGhhdC5nZXRFbGFwc2VkRHVyYXRpb24oKSArIHRoYXQuc3RhcnRQb3NpdGlvbixcbiAgICAgIC8vICBcInNlY1wiKTtcbiAgICAgIGlmICgodGhhdC5zdGF0dXMgIT09IHRoYXQuSVNfUEFVU0VEKSAmJiAodGhhdC5nZXRFbGFwc2VkRHVyYXRpb24oKSArIHRoYXQuc3RhcnRQb3NpdGlvbiA+IHRoYXQuYnVmZmVyRHVyYXRpb24pKSB7XG4gICAgICAgIGlmICghdGhhdC5sb29wKSB7XG4gICAgICAgICAgdGhhdC5zdGF0dXMgPSB0aGF0LklTX1NUT1BQRUQ7XG4gICAgICAgICAgdGhhdC5zdGFydFBvc2l0aW9uID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuZW1pdChcImVuZGVkXCIsIHRoYXQuc3RhcnRQb3NpdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIENvbW1vbkpTIGZ1bmN0aW9uIGV4cG9ydFxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
