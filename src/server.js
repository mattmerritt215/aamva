import express from 'express';
import { makePDF417, makeCode128 } from './barcode.js';

const app = express(); 
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); 

app.get('/api/barcode/pdf417', async (req, res) => {
    try {
        const text = req.query.text ?? '';
        const png = await makePDF417(text, {});
        res.set('Content-Type', 'image/png');
        res.send(png);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

app.get('/api/barcode/code128', async (req, res) => {
    try {
        const text = req.query.text ?? '';
        const png = await makeCode128(text, {});
        res.type('image/png').send(png);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

app.post('/api/barcode/pdf417', express.json(), async (req, res) => {
    try {  
        const text = req.body.text ?? '';
        const png = await makePDF417(text, {});
        res.type('image/png').send(png);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }   
});

app.post('/api/barcode/code128', express.json(), async (req, res) => {
    try {  
        const text = req.body.text ?? '';
        const png = await makeCode128(text, {});
        res.type('image/png').send(png);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }   
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
