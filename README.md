# The `player` object

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


## Example

```
    var audioContext = new webkitAudioContext();
    var targetNode   = audioContext.destination;
    bufferLoader.load('snd/bach.mp3', onLoaded, audioContext);

    function onLoaded(audioBuffer){
    	var player = createPlayer(audioBuffer, audioContext);
    	player.connect(targetNode); // unconnected by default
    	player.start();
    });
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
