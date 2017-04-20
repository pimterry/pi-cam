process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

const express = require('express');
const Splitter = require('stream-split');
const Transform = require('stream').Transform;
const raspivid = require('raspivid');

const NALseparator = new Buffer([0,0,0,1]);
var firstFrames = [];
var lastIdrFrame = null;

function startRecording() {
    raspivid({
        width: 960,
        height: 540,
        framerate: 12,
        profile: 'baseline',
        timeout: 0
    })
    .pipe(new Splitter(NALseparator))
    .pipe(new Transform({ transform: function (chunk, encoding, callback) {
        // Capture the first two chunks (SPS & PPS), so we can reproduce them for later clients.
        if (firstFrames.length < 2) {
            console.log('Saving frame', firstFrames.length);
            firstFrames.push(Buffer.concat([NALseparator, chunk]));
        } else if (chunk[0] == 0x25) {
            console.log('Saving IDR frame');
            lastIdrFrame = Buffer.concat([NALseparator, chunk]);
        }

        // No actual transformations here.
        this.push(chunk);
        callback();
    }}))
    .on('data', broadcastStream);
}

const app = express();
const wss = require('express-ws')(app);

function broadcastStream(data) {
    const clients = wss.getWss().clients;

    if (clients.size > 0) console.log('Broadcasting to', clients.size, 'client(s)');

    clients.forEach((socket) => {
        socket.send(Buffer.concat([NALseparator, data]), { binary: true }, (error) => {
            if (error) console.error(error);
        });
    });
}

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.ws('/video-stream', (ws, req) => {
    console.log('Client connected');

    ws.send(JSON.stringify({
      action: 'init',
      width: '960',
      height: '540'
    }));

    // Resend the first two frames that define the stream parameters
    firstFrames.forEach((frame) => {
        ws.send(frame, { binary: true }, (error) => { if (error) console.error(error) });
    });
    // Send the last IDR frame, so our diff frames are sort-of close
    ws.send(lastIdrFrame, { binary: true }, (error) => { if (error) console.error(error) });

    ws.on('message', (msg) => {
        console.log('Received message: "' + msg.toString() + '"');
    });

    ws.on('close', () => console.log('Client left'));
});

startRecording();
app.listen(80, () => console.log('Server started on 80'));

