const express = require('express');
const Splitter = require('stream-split');
const raspivid = require('raspivid');
const fs = require('fs');

function startRecording() {
    const NALseparator = new Buffer([0,0,0,1]);

    const video = raspivid({
        width: 640,
        height: 480,
        framerate: 12,
        profile: 'baseline'
    });

    video.pipe(new Splitter(NALseparator)).on('data', broadcastStream);
}

const app = express();
const wss = require('express-ws')(app);

function broadcastStream(data) {
    wss.getWss().clients.forEach((socket) => {
        if (socket.busy) return;

        socket.busy = true;
        socket.send(Buffer.concat([NALseparator, data]), { binary: true }, (error) => {
            console.error(error);
            socket.busy = false;
        });
    });
}

app.get('/', (req, res) => {
    res.status(200).send('Hello world');
});

app.ws('/video-stream', (ws, req) => {
    console.log('Client connected');

    ws.send(JSON.stringify({
      action: 'init',
      width: '640',
      height: '480'
    }));

    ws.on('message', (msg) => console.log('Received', msg));

    ws.on('close', () => console.log('Client left'));
});

startRecording();
app.listen(80, () => console.log('Server started on 80'));