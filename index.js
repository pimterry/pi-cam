process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

const express = require('express');
const Splitter = require('stream-split');
const raspivid = require('raspivid');

const NALseparator = new Buffer([0,0,0,1]);

function startRecording() {
    const video = raspivid({
        width: 960,
        height: 540,
        framerate: 12,
        profile: 'baseline',
        timeout: 0
    });

    video.pipe(new Splitter(NALseparator)).on('data', broadcastStream);
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

    ws.on('message', (msg) => {
        console.log('Received message: "' + msg.toString() + '"');
        if (msg.split(' ')[0] === 'REQUESTSTREAM') {
            startRecording();
        }
    });

    ws.on('close', () => console.log('Client left'));
});

app.listen(80, () => console.log('Server started on 80'));

