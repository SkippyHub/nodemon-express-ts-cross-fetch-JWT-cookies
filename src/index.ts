// node express app
import express from 'express';
import cors from 'cors';
// import fetch from 'node-fetch';
import fetch from 'cross-fetch';
import dotenv from 'dotenv';
dotenv.config();
const USERNAME = process.env.USERNAME
const PASSWORD = process.env.PASSWORD


const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors(
    {
        origin: '*',
        // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true
    }
));
app.use(express.json());



app.get('/', async (req, res) => {
    res.send('Hello World!');
});

// lamda async fetch response
const loginLamda = async (username: string, password: string) => {
    
    let url = 'https://hub.docker.com//v2/users/login';

    let options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },

    body: `{"username":"${username}","password":"${password}"}`
    };
// docker async fetch response
    const docker = await fetch(url, options)
        .then(res => res)
        // .then(json => {
        //     console.log(json);
        //     return json;
        // })
        // .catch(err => {
        //     console.log(err);
        // });
        console.log(docker.headers.get('set-cookie'));
        console.log(await docker.json())
    
        // const response = await fetch('https://example.com');

        // // Returns an array of values, instead of a string of comma-separated values
        // console.log(response.headers.raw()['set-cookie']);

}
// console log loginLamda();
loginLamda(`${USERNAME}`, `${PASSWORD}`);


// node express app listen
app.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`);
});
