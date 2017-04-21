process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  console.log(err.stack);
});

const express = require('express');
const raspividStream = require('raspivid-stream');

const app = express();
const wss = require('express-ws')(app);

const Blinkt = require('node-blinkt');
const leds = new Blinkt();
leds.setup();
leds.clearAll();

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.ws('/video-stream', (ws, req) => {
    console.log('Client connected');
    updateLeds();

    ws.send(JSON.stringify({
      action: 'init',
      width: '960',
      height: '540'
    }));

    var videoStream = raspividStream();

    videoStream.on('data', (data) => {
        ws.send(data, { binary: true }, (error) => { if (error) console.error(error); });
    });

    ws.on('close', () => {
        console.log('Client left');
        updateLeds();
        videoStream.removeAllListeners('data');
    });
});

function updateLeds() {
    const clientCount = wss.getWss().clients.size;
    console.log('Updating leds to show', clientCount, 'clients');

    leds.clearAll();

    for (let i = 0; i < clientCount; i++) {
        console.log('setting pixel', i, 'to', colors);
        leds.setPixel(i, [255, 0, 0], 1);
    }

    leds.sendUpdate();
}

app.use(function (err, req, res, next) {
  console.error(err);
  next(err);
})

app.listen(80, () => console.log('Server started on 80'));

