import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookies from 'cookie'
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
// import csrf from 'csurf'; //deprecated
import cors from 'cors';
import bcrypt from 'bcrypt';

dotenv.config();

// const {
//     invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
//     generateToken, // Use this in your routes to provide a CSRF hash cookie and token.
//     validateRequest, // Also a convenience if you plan on making your own middleware.
//     doubleCsrfProtection, // This is the default CSRF protection middleware.
//   } = doubleCsrf(doubleCsrfOptions);
var Hostpsifi = "Host-psifi";
const doubleCsrfUtilities = doubleCsrf({
    getSecret: () => "Secret", // A function that optionally takes the request and returns a secret
    cookieName: `__${Hostpsifi}.x-csrf-token`, // The name of the cookie to be used, recommend using Host prefix.
    cookieOptions: {
      httpOnly : true,
      sameSite : "lax",  // Recommend you make this strict if possible
      path : "/",
      secure : true,
    //   ...remainingCOokieOptions // Additional options supported: domain, maxAge, expires
    },
    size: 64, // The size of the generated tokens in bits
    ignoredMethods: ["GET", "HEAD", "OPTIONS"], // A list of request methods that will not be protected.
    getTokenFromRequest: (req) => req.headers["x-csrf-token"], // A function that returns the token from the request
  });

const app: Express = express();

app.use(cookieParser());

app.use(express.json());

// var csrfProtection = csrf({ cookie: true }) //deprecated
// learn more at https://github.com/expressjs/csurf


app.use(cors(
    {
        // origin: "http://localhost:5173",
        origin: /localhost/,
        // origin: "*",
        credentials: true,

    }
))


// Use this as an example for creating a specific cors policy?
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', 'https://localhost:5173/')
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
//     res.setHeader('Access-Control-Allow-Credentials', 'true')
//     next()
//   })


const port = 3000

// constants
const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY??"secret" as string;
const SECRET_JWT__REFRESH_KEY = process.env.SECRET_JWT__REFRESH_KEY ??"secret" as string;
console.log(`secret: ${SECRET_JWT_KEY}`);

// User database.
let refreshTokens: any[] = [];

// set a cookie
// app.use(function (req, res, next) {
//   // check if client sent cookie
//   var cookie = req.cookies.cookieName;
//   if (cookie === undefined) {
//     // no: set a new cookie
//     var randomNumber=Math.random().toString();
//     randomNumber=randomNumber.substring(2,randomNumber.length);
//     res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
//     console.log('cookie created successfully');
//   } else {
//     // yes, cookie was already present 
//     console.log('cookie exists', cookie);
//   } 
//   res.setHeader("Authorization", "Bearer " + cookie);
//   next(); // <-- important!
// });


// remake this with CSRF-CSRF

//  //deprecated
app.get('/',
// csrfProtection,
 (req: Request, res: Response) => {
    
    // res.cookie('CSRF-TOKEN', req.csrfToken());
    // res.header('x-csrf-token', req.csrfToken());
    res.send('Hello World!');
});



// app.post("/cookie", (req: Request, res: Response) => {
//     console.log(req.body)
//     // console.log(req.cookies)

//     console.log(req.headers)
    
//     res.cookie('sfoaofjao', 'value', { maxAge: 900000, httpOnly: true });
//     res.json({ message: 'Hello World!' });
//     res.status(200)
//     // res.send("cookie created successfully");
// } );



// login endpoint (POST /login) which provides two tokens:
// - a JWT token which expires in 1 hour
// - a JWT token which expires in 7 days


// JWT login endpoint (POST /login) which provides two tokens:
app.post('/login',
// csrfProtection, //deprecated
 (req: Request, res: Response) => {
    // console.log("req");
    // console.log(req);
    // // console.log("req.body.credential");
    // // console.log(req.body.credential);

    console.info(req.body.username + ' is trying to login');
    const username = req.body.username as string;
    const password = bcrypt.hashSync(req.body.password, 8)
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
        res.cookie('accessToken', accessToken, { maxAge: 900000, httpOnly: true });
        res.json({
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});


// JWT register endpoint (POST /register) which provides two tokens:
app.post('/register', (req: Request, res: Response) => {
console.log(req.body);
console.info(req.body.username + ' is trying to register');
    const username = req.body.username as string;
    const password = req.body.password as string; // should be bcrypt'd

    const user = {
        username: username,
        password: password
    }

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
    catch(err) {
        res.status(500).send(err);
    }
});    

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



app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});