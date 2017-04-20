process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

const express = require('express');
const fs = require('fs');
const Splitter = require('stream-split');
const Throttle = require('stream-throttle').Throttle;
const Transform = require('stream').Transform;
const raspivid = require('raspivid');
const spawn = require('child_process').spawn;

const NALseparator = new Buffer([0,0,0,1]);

function startRecording() {
    var proc = spawn('raspivid', ['-t', '0', '-o', '-', '-w', 960, '-h', 540, '-fps', 12, '-pf', 'baseline']);
    proc.stdout
    .pipe(new Splitter(NALseparator))
    .pipe(new Transform({ transform: function (chunk, encoding, callback) {
        // Transform NAL unit
        if (chunk[0] === 0x25) {
            chunk[0] = 0x65;
        } else if (chunk[0] === 0x21) {
            chunk[0] = 0x41;
        }
        this.push(chunk);
        callback();
    }}))
    .on('data', broadcastStream);
}

const app = express();
const wss = require('express-ws')(app);

var recording = false;

function broadcastStream(data) {
    const clients = wss.getWss().clients;

    if (clients.size > 0) console.log('Broadcasting to', clients.size, 'client(s)');

    clients.forEach((socket) => {
        if (socket.busy) return;

        socket.busy = true;
        socket.send(Buffer.concat([NALseparator, data]), { binary: true }, (error) => {
            if (error) console.error(error);
            socket.busy = false;
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

    if (!recording) {
        startRecording();
        recording = true;
    }

    ws.on('message', (msg) => console.log('Received', msg));

    ws.on('close', () => console.log('Client left'));
});

app.listen(80, () => console.log('Server started on 80'));

