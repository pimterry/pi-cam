var express = require('express');
var raspivid = require('raspivid');
var fs = require('fs');

const VIDEO = '/data/video.h264';

const file = fs.createWriteStream(VIDEO);
const video = raspivid({
    width: 640,
    height: 480,
    framerate: 12,
    profile: 'baseline'
});

video.pipe(file);

var app = express();

app.get('/', (req, res) => {
    res.send(200, 'Hello world');
});

app.get('/video', (req, res) => res.sendFile(VIDEO));

app.listen(80, () => console.log('Server started on 80'));