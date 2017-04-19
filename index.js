var express = require('express');

var app = express();

app.get('/', (req, res) => {
    res.send(200, 'Hello world');
});

app.listen(80, () => console.log('Server started on 80'));