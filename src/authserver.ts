import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookies from 'cookie'
import cookieParser from "cookie-parser";
import cors from 'cors'; // for cross-domain requests
import csrf from 'csurf'; // CSRF protection
// import bcrypt from 'bcrypt';
const bcrypt = require('bcrypt');
// import { PrismaClient } from '@prisma/client'
import { PrismaClient } from '../node_modules/.prisma/client' // related bug  https://github.com/prisma/prisma/issues/13672#issuecomment-1152581890

const prisma = new PrismaClient()


dotenv.config();

const app: Express = express();

app.use(cookieParser());

app.use(express.json());

var csrfProtection = csrf({ cookie: true })
// learn more at https://github.com/expressjs/csurf


app.use(cors(
    {
        // origin: "http://localhost:5173",
        origin: /localhost/, //wildcard regex for any.localhost:any
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


const port = 3001

// constants
const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY ?? "secret" as string;
const SECRET_JWT__REFRESH_KEY = process.env.SECRET_JWT__REFRESH_KEY ?? "secret" as string;
console.log(`secret: ${SECRET_JWT_KEY}`);

// User database.
let refreshTokens: any[] = [];
let user: any[] = [];

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



app.get('/', csrfProtection, (req: Request, res: Response) => {
    res.cookie('CSRF-TOKEN', req.csrfToken());
    res.header('x-csrf-token', req.csrfToken());
    res.send('Express auth server with CRSF protection and JWT tokens');
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
async function all() {
    const allUsers = await prisma.user.findMany();
    return allUsers;
}
async function getUserPrisma(username: string) {
    const userPrisma = await prisma.user.findUnique(
        {
            where: {
                username: username
            }
        }
    )
    return await userPrisma
}

async function createUserPrisma(username: string, password: string) {
    const userPrisma = await prisma.user.create({
        data: {
            username: username,
            email: null,
            password: password,
            email_confirmed_date: null,
            phone: "null",
            phone_confirmed_date: null,
            last_login_date: null,
        },
    })
    console.log(userPrisma);
    return userPrisma
}


// JWT login endpoint (POST /login) which provides two tokens:
app.post('/login', csrfProtection, async (req: Request, res: Response) => {
    console.info(req.body.username + ' is trying to login');
    const username = req.body.username as string;

    // const password = bcrypt.hashSync(req.body.password, 8)
    // during login no need to encrypt password.
    const password = req.body.password as string;
    // verify(req.body.credential);

    const user = {
        username: username,
        password: password
    }

    // this should be a stand alone function

    var userPrisma = await getUserPrisma(username);

    console.log(userPrisma);
    if (userPrisma) {
        const valid = await bcrypt.compare(password, userPrisma.password);
        if (valid) {
            try {
                // const token = jwt.sign(user, SECRET_JWT_KEY, { expiresIn: '1h' });
                const accessToken = generateToken({ username: user.username }, SECRET_JWT_KEY, '1h');
                // const refreshToken = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
                const refreshToken = generateToken({ username: user.username }, SECRET_JWT__REFRESH_KEY, '7d');
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
        } else {
            res.status(403).json({'error':'Invalid password'});
        }
    }

    if (!userPrisma) {
        console.log('User not found');
        res.status(401).json({'error':'User not found'});
    }
  });


// JWT register endpoint (POST /register) which provides two tokens:
app.post('/signup', (req: Request, res: Response) => {
    console.log(req.body);
    console.info(req.body.username + ' is trying to signup');
    // const username = req.body.username as string;
    // const password = bcrypt.hashSync(req.body.password, 10) as string

    
    const user = {
        username: req.body.username as string,
        password: bcrypt.hashSync(req.body.password, 10) as string
    }


    var userPrisma = createUserPrisma(user.username, user.password);
    
    console.log(userPrisma);

    try {
        // const token = jwt.sign(user, SECRET_JWT_KEY, { expiresIn: '1h' });
        const accessToken = generateToken({ username: user.username }, SECRET_JWT_KEY, '1h');
        // const refreshToken = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
        const refreshToken = generateToken({ username: user.username }, SECRET_JWT__REFRESH_KEY, '7d');
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