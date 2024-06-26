const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 3000;

app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketIo(server);

const client = new Client();
const messages = [];

client.on('qr', qrCodeData => {
    qrcode.generate(qrCodeData, { small: true });

    const base64Image = generateBase64Image(qrCodeData);
    console.log('QR Code Token:', qrCodeData);
    console.log('QR Code Image (base64):', base64Image);

    app.set('qrCodeData', qrCodeData);
    app.set('base64Image', base64Image);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async message => {
    try {
        const contact = await message.getContact();
        const name = contact.name || 'Unknown';

        const formattedMessage = {
            sender: name,
            body: message.body,
            timestamp: message.timestamp,
        };

        messages.push(formattedMessage);

        io.emit('newMessage', formattedMessage);

        console.log(name + ": " + message.body);
    } catch (error) {
        console.error('Error retrieving contact information:', error);
    }
});

client.initialize();

app.get('/qr', (req, res) => {
    const qrCodeData = app.get('qrCodeData');
    const base64Image = app.get('base64Image');

    res.json({
        token: qrCodeData,
        base64Image: base64Image,
    });
});

app.get('/message', (req, res) => {
    res.json(messages);
});

io.on('connection', socket => {
    console.log('Client connected');
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});
