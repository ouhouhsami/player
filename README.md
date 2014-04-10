# Player module

> WAVE audio library module for audio buffer playing.

The `player` object provides the following methods:

- `start()`
- `pause()`
- `stop() `
- `setBuffer(audioBuffer)`
- `setGain(float)`
- `setSpeed(float)`
- `seek(float)`
- `enableLoop(bool)`
- `on('ended', callback)`
- `getStatus()`


## Example

```js
    var audioContext = new AudioContext();
    var targetNode   = audioContext.destination;
    var myBufferLoader = createBufferLoader();
    myBufferLoader.load('sound/file/path', onLoaded, audioContext);

    function onLoaded(audioBuffer){
    	var player = createPlayer(audioBuffer, audioContext);
    	player.connect(targetNode); // unconnected by default
    	player.start();
    }
```

## API

The `player` object exposes the following API:

Method | Description
--- | ---
`player.start()` | Start playing.
`player.pause()` | Pause playing.
`player.stop()`  | Stop playing.
`player.setBuffer(audioBuffer)` | Set audio buffer to be played and internal `bufferDuration` property.
`player.setGain(float)` | Set internal `gain` property and apply a squared volume.
`player.setSpeed(float)` | Set playback speed.
`player.seek(float)` | Seek buffer position (in seconds).
`player.enableLoop(bool)` | Enable or disable looping playback.
`player.on('ended', function() { ... })` | Listen to the `'ended'` event.
`player.getStatus()` | Get player status (`IS_PLAYING`, `IS_PAUSED`, `IS_STOPPED`).

## Tests

If grunt is not installed

```bash
$ npm install -g grunt-cli
```

Install all depencies in the module folder 

```bash
$ npm install
```

Run the server on 9001 port (you can change the port in the Grunfile.js)

```bash
$ grunt test
```

Run the test via the web browser on `http://localhost:9001/tests`

## License

This module is released under the [BSD-3-Clause license](http://opensource.org/licenses/BSD-3-Clause).

## Acknowledgments

This code is part of the WAVE project (http://wave.ircam.fr), funded by ANR (The French National Research Agency), *ContInt* program, 2012-2015.