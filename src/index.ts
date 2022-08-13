// node express app
import express from 'express';
import cors from 'cors';
// import fetch from 'node-fetch';
import fetch, { Request, Response, Headers } from 'cross-fetch';

// import cookie parse
// import cookie 
import cookie from 'cookie';
import cookieParser from 'cookie-parser';


// import jasonwebtoken
import jwt from 'jsonwebtoken';


import dotenv from 'dotenv';
import { json } from 'stream/consumers';
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


// here is an example of fetching docker repos with cross-fetch, cookie parser and jwt
//https://github.com/lquixada/cross-fetch/blob/main/examples/typescript/index.ts
// lamda async fetch response
const loginLamda = async (username: string, password: string) => {

    let url = 'https://hub.docker.com//v2/users/login';

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },

        body: `{"username":"${username}","password":"${password}"}`
    };
    // docker async fetch response
    const docker = await fetch(url, options)
        .then(res => res)


    const body = await docker.json()

    // this is not the normal way to do this as this is a hack due to dockerhub api being broken.
    const cookies = cookie.parse(docker.headers.get('set-cookie') ?? "".split(',')[0]);


    let token = body.token;
    console.log("token: ", token);
    let csrftoken = cookieParser.JSONCookies(cookies).csrftoken;
    console.log("csrftoken: ", csrftoken);

    // decode the token to get the user id  
    // type issues need to assign decoded payload variable as any type 
    let decoded: any = jwt.decode(token);

    // let datajson = JSON.stringify(decoded);
    // console.log(datajson);

    let namespaces = decoded?.username ?? "";
    let repourl = `https://hub.docker.com//v2/namespaces/${namespaces}/repositories/`;

    let repooptions = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            cookie: `csrftoken=${csrftoken};token=${token}`
        }
    };
    const dockerrepo = await fetch(repourl, repooptions)
    console.log("dockerrepo: ", dockerrepo);
    const repobody = await dockerrepo.json()
    console.log("repobody: ", repobody);
}
// console log loginLamda();
loginLamda(`${USERNAME}`, `${PASSWORD}`);


// node express app listen
app.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`);
});
