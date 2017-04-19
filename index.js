var express = require('express');

var app = express();

app.get('/', (req, res) => {
    res.send(200, 'Hello world');
});

app.listen(8080, () => console.log('Server started on 8080'));