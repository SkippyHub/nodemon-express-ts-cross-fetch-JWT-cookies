import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookies from 'cookie'
import cors from 'cors';
import cookieParser from "cookie-parser";


dotenv.config();

const app: Express = express();
app.use(cookieParser());
app.use(cors(
    {
        // origin: "http://localhost"
        origin: "*",
        credentials: true,

    }
))


const port = 3000

// constants
const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY as string;
const SECRET_JWT__REFRESH_KEY = process.env.SECRET_JWT__REFRESH_KEY as string;

// User database.
let refreshTokens: any[] = [];



app.use(express.json());

// express-openid-connect authentication.

// import { auth } from 'express-openid-connect';

// const config = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: 'a long, randomly-generated string stored in env',
//   baseURL: 'http://localhost:3000',
//   clientID: 'YNsJ82inVBYCubgOKTAALfFoAZDCQN01',
//   issuerBaseURL: 'https://dev-m7m0osgf.us.auth0.com'
// };


// set a cookie
app.use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.cookieName;
  if (cookie === undefined) {
    // no: set a new cookie
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
    console.log('cookie created successfully');
  } else {
    // yes, cookie was already present 
    console.log('cookie exists', cookie);
  } 
  next(); // <-- important!
});


app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});


// let static middleware do its job
// app.get(express.static(__dirname + '/public'));

// // auth router attaches /login, /logout, and /callback routes to the baseURL
// app.use(auth(config));

// // req.isAuthenticated is provided from the auth router
// app.get('/', (req, res) => {
//   res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
// });



// login endpoint (POST /login) which provides two tokens:
// - a JWT token which expires in 1 hour
// - a JWT token which expires in 7 days


// JWT login endpoint (POST /login) which provides two tokens:
app.post('/login', (req: Request, res: Response) => {
    // console.log("req");
    // console.log(req);
    // console.log("req.body.credential");
    // console.log(req.body.credential);

    // console.info(req.body.username + ' is trying to login');
    const username = req.body.username as string;
    const password = req.body.password as string; // should be bcrypt'd
    // verify(req.body.credential);

    const user = {
        username: username,
        password: password
    }

    // this should be a stand alone function

    try {
        // const token = jwt.sign(user, SECRET_JWT_KEY, { expiresIn: '1h' });
        const accessToken = generateToken(user, SECRET_JWT_KEY, '1h');
        // const refreshToken = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
        const refreshToken = generateToken(user, SECRET_JWT__REFRESH_KEY, '7d');
        refreshTokens.push(refreshToken);
        res.json({
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
    catch (err) {
        res.status(500).send(err);
    }
});


// // JWT register endpoint (POST /register) which provides two tokens:
// app.post('/register', (req: Request, res: Response) => {
// console.log(req.body);
// console.info(req.body.username + ' is trying to register');
//     const username = req.body.username as string;
//     const password = req.body.password as string; // should be bcrypt'd

//     const user = {
//         username: username,
//         password: password
//     }

//     try {
//         // const token = jwt.sign(user, SECRET_JWT_KEY, { expiresIn: '1h' });
//         const accessToken = generateToken(user, SECRET_JWT_KEY, '1h');
//         // const refreshToken = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
//         const refreshToken = generateToken(user, SECRET_JWT__REFRESH_KEY, '7d');
//         refreshTokens.push(refreshToken);
//         res.json({
//             accessToken: accessToken,
//             refreshToken: refreshToken,
//         });
//     }    
//     catch(err) {
//         res.status(500).send(err);
//     }
// });    

// token refresh endpoint (POST /refresh) which provides a new token
// which expires in 7 days
app.post('/refreshtoken', authenicateToken, (req: Request, res: Response) => {
    console.info(req.body.user.username + ' is trying to refresh token');
    console.info(req.body);
    const refreshToken = req.body.refreshToken as string;

    if (req.body.refreshToken === null) {
        return res.sendStatus(401);
    }
    const user = req.body.user;
    if (refreshTokens.indexOf(refreshToken) === -1) {
        return res.sendStatus(403);
    }

    if (refreshToken.includes(req.body.refreshToken)) {
        const user = {
            username: req.body.user.username,
        }
        try {
            // const token = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
            // const token = generateToken(user, SECRET_JWT__REFRESH_KEY, '7d');
            const accessToken = generateToken({ username: user.username }, SECRET_JWT_KEY, '1h');
            res.json({
                accesstoken: accessToken,
            });
        }
        catch (err) {
            res.status(500).send(err);
        }
    }
}
);

export interface GitHubUser {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    name: string;
    company: null;
    blog: string;
    location: string;
    email: null;
    hireable: null;
    bio: null;
    twitter_username: null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: Date;
    updated_at: Date;
}

app.get("/api/oauth/github", async (req: Request, res: Response) => {
    // console.log(req)
    const code = req.query.code as string;
    const path = req.query.path;
    const state = req.query.state;
    console.log("/api/oauth/github code");
    console.log(code);
    console.log("/api/oauth/github path");
    console.log(path);
    if (state){
        console.log("/api/oauth/github state");
        console.log(state);
    }
  

    const gitHubUser = await getGitHubUser({ code });


    // this should be a stand alone function
    try {
        const accessToken = generateToken(gitHubUser, SECRET_JWT_KEY, '1h');
        const refreshToken = generateToken(gitHubUser, SECRET_JWT__REFRESH_KEY, '7d');

        // to be store user in database

        //to  be storage of refresh tokens.
        refreshTokens.push(refreshToken);


        // const payloadJson = { accessToken: accessToken, refreshToken: refreshToken };
        // const payload = JSON.stringify(payloadJson);
        // console.log("payload", payload);


        // need to deside where to store the token, which is in the cookie or in the database.
        // or to make individual payloads of refresh and access token.


        // should all be under one cookie "deploy.me"
        // don't combine tokens and send both as res.cookies
        res.cookie("refreshToken", refreshToken, {
            httpOnly: false,
            domain: "localhost",

            // domain: "http://localhost:5173/",
            });

        res.cookie("accessToken", accessToken, {
            httpOnly: false,
            domain: "localhost",

            // domain: "http://localhost:5173/",
            });
        // res.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);


    }
    catch (err) {
        res.status(500).send(err);
    }

    // redirecting to hand on the github token from the fetch to the backend.
    res.redirect(`http://localhost:5173`);
    // res.send("ok")
});


// app.get("/api/user", authenicateToken, (req: Request, res: Response) => {
app.get("/api/user", authenicateToken, (req: Request, res: Response, next) => {
    console.log("this is a req",req);
    console.log("this is a req.headers", req.headers);
    console.log("this is a req.headers.cookies", req.headers.cookies);
    console.log("this is a req.headers.authorization", req.headers.authorization);

    // console.log("this is a req.cookies", req.cookies);
    // console.log("req.header.cookies", req.cookies);
    
    // function get user from function  database


    // const payload ={
    //     username: "test",
    //     password: "test",
    // }
    // res.cookie("payload", payload, {
    //     httpOnly: true,
    //     domain: "localhost",
    // })

    res.send({"ok": "ok"});

    // next();
    // res.redirect(`http://localhost:5173`);

    // try {
    //   const decode = jwt.verify(deploymetoken, SECRET_JWT_KEY);
    // console.log("decode", decode);
    //   return res.send("decode");
    // } catch (error) {
    //   return res.send(error);
    // }
    // res.sendStatus(200);
});

// const severport = import.meta.env.VITE_AUTH_SERVER_PORT || 3001;
const severport = 3001;

// const serverhost = import.meta.env.VITE_AUTH_SERVER_HOST || 'localhost';

const githubapiconfig = {
    clientID: '266409182fc0ce6069fe',
    clientSecret: '0bafb9dc12e0529543afdf78fba8bcd3998d7a3c',
    authorizationPath: 'https://github.com/login/oauth/authorize',
    tokenPath: 'https://github.com/login/oauth/access_token',
    profilePath: 'https://api.github.com/user',
    scope: '',
    RedirectURL: `http://localhost:${severport}/api/oauth/github`,
    path: "/",
};


async function getGitHubUser({ code }: { code: string }): Promise<GitHubUser | null> {

    // console.log(`https://github.com/login/oauth/access_token?client_id=${githubapiconfig.clientID}&client_secret=${githubapiconfig.clientSecret}&code=${code}`)
    const githubToken = await fetch
        (
            `https://github.com/login/oauth/access_token?client_id=${githubapiconfig.clientID}&client_secret=${githubapiconfig.clientSecret}&code=${code}`
        ).then((res) => res)
        .catch((error) => {
            // console.log(error);
            throw error.message;
        });

    const githubres = await githubToken
    // console.log("githubres" , githubres);
    // console.log("githubToken", githubToken);
    const githubtext = await githubToken.text();
    // console.log("githubtext", githubtext);
    const decoded = new URLSearchParams(githubtext);

    // console.log("decoded");
    // console.log(decoded);

    const githubuserfetch = await fetch(`https://api.github.com/user`, {
        headers: {
            Authorization: `Bearer ${decoded.get('access_token')}`,
        },
    }
    )
        .catch((error) => {
            //   console.log("error:\n", error);
            throw error.message;
        });
    const githubuser: GitHubUser = await githubuserfetch.json();
    // console.log("githubuser", githubuser);

    return githubuser;
}


// middleware
function generateToken(user: any, secret: string, expiresIn: string) {
    return jwt.sign(user, secret, { expiresIn: expiresIn });
}

function authenicateToken(req: Request, res: Response, next: Function) {
    const authHeader = req.headers['authorization'];
    // console.info(req.body);

    // console.info(authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    jwt.verify(token, SECRET_JWT_KEY, (err: any, user: any) => {
        if (err) {
            return res.sendStatus(403);
        }
        // req.body.user = user;
        // req.body.refreshToken = req.body.refreshToken
        next();
    });
}


// Oauth2 login and log out endpoints
// import { oauth2 } from 'express-openid-connect';


// google verification compares the incoming login token to the client secret stored in the client_secret json file.
// import web from './client_secret_645019049112-po8oqm5pbfgk7ubo2v5kbvkvnodt0f03.apps.googleusercontent.com.json'
// const { OAuth2Client } = require('google-auth-library');
// const client = new OAuth2Client(web.web.client_id);
// async function verify(token: string) {
//     try {
//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: web.web.client_id,  // Specify the CLIENT_ID of the app that accesses the backend
//             // Or, if multiple clients access the backend:
//             //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
//         });
//         const payload = ticket.getPayload();
//         const userid = payload['sub'];
//         console.log("payload")
//         console.log(payload)
//     } catch (error) {
//         console.log(error)
//     }
// }

app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});