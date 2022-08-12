// node express app
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('Hello World!');
});



app.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`);
}
);
