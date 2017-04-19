process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

const express = require('express');
const Splitter = require('stream-split');
const raspivid = require('raspivid');

const NALseparator = new Buffer([0,0,0,1]);

function startRecording() {
    const video = raspivid({
        width: 640,
        height: 480,
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
        if (socket.busy) return;

        socket.busy = true;
        socket.send(Buffer.concat([NALseparator, data]), { binary: true }, (error) => {
            if (error) console.error(error);
            socket.busy = false;
        });
    });
}

app.get('/', (req, res) => res.sendfile(__dirname + '/index.html'));
app.get('/player.js', (req, res) => res.sendfile(require.resolve('h264-live-player')));

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