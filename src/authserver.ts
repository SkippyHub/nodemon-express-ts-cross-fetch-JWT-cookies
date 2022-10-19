import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookies from 'cookie'
import cookieParser from "cookie-parser";
import cors from 'cors'; // for cross-domain requests
import csrf from 'csurf'; // CSRF protection
// import bcrypt from 'bcrypt';
const bcrypt = require('bcryptjs');
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

    // }
// ))

// https://httptoolkit.tech/blog/cache-your-cors/
// app.use(cors({
    // Set the browser cache time for preflight responses
    maxAge: 86400,
    preflightContinue: true // Allow us to manually add to preflights
}));

// Add cache-control to preflight responses in a separate middleware:
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        // No Vary required: cors sets it already set automatically
        res.end();
    } else {
        next();
    }
});

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
// let refreshTokens: any[] = [];
// let user: any[] = [];

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



app.get('/', csrfProtection, authenicateToken, (req: Request, res: Response) => {
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

    // Verify CSRF credential
    // verify(req.body.credential);

    const user = {
        username: req.body.username as string,
        password: req.body.password as string,
    }

    // this should be a stand alone function

    var userPrisma = await getUserPrisma(user.username);

    console.log(userPrisma);
    if (userPrisma) {
        const valid = await bcrypt.compare(user.password, userPrisma.password);
        if (valid) {
            try {
                // const token = jwt.sign(user, SECRET_JWT_KEY, { expiresIn: '1h' });
                const accessToken = generateToken({ username: user.username }, SECRET_JWT_KEY, '1h');
                // const refreshToken = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
                const refreshToken = generateToken({ username: user.username }, SECRET_JWT__REFRESH_KEY, '7d');

                //add refresh token to prisma database
                const refreshTokenPrisma = await prisma.refreshTokens.create({
                    data: {
                        token: refreshToken,
                        user: {
                            connect: {
                                username: user.username
                            }
                        }
                    }
                })
                console.log(refreshTokenPrisma);

                // refreshTokens.push(refreshToken);
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
app.post('/signup', async (req: Request, res: Response) => {
    console.log(req.body);
    console.info(req.body.username + ' is trying to signup');
    // const username = req.body.username as string;
    // const password = bcrypt.hashSync(req.body.password, 10) as string

    // Verify CSRF credential
    // verify(req.body.credential);
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

        //add refresh token to prisma database
        const refreshTokenPrisma = await prisma.refreshTokens.create({
            data: {
                token: refreshToken,
                user: {
                    connect: {
                        username: user.username
                    }
                }
            }
        })

        console.log(refreshTokenPrisma);
        // refreshTokens.push(refreshToken);
        res.json({
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
    catch (err) {
        res.status(500).send(err);
    }
});

//logout app post that deletes the refresh token from the database.
app.post('/logout', async (req: Request, res: Response) => {
    console.log(req.body);
    console.info(req.body.username + ' is trying to logout');
    res.cookie('CSRF-TOKEN', '', { maxAge: 0, httpOnly: true });
    res.header('x-csrf-token', '');

    res.cookie('accessToken', '', { maxAge: 0, httpOnly: true });
    res.cookie('refreshToken', '', { maxAge: 0, httpOnly: true });



    const user = {
        username: req.body.username as string,
        refreshToken: req.body.refreshToken as string
    }

    //delete refresh token from prisma database
    // swap to find one and update expires date to now or something effecient.
    // const refreshTokenPrisma = await prisma.refreshTokens.delete({
    //     where: {
    //         token: user.refreshToken
    //     }
    // })

    // console.log(refreshTokenPrisma);
    res.status(200).send('Logged out');
});

// token refresh endpoint (POST /refresh) which provides a new token
// which expires in 7 days

// swap to a find one, IF EXPIRE field is not valid ( exipre > now) to now then return error
app.post('/refreshtoken', authenicateToken, async (req: Request, res: Response) => {

    const user = {
        username: req.body.username as string,
        // password: req.body.password as string,
    }

    console.info(req.body.username + ' is trying to refresh token');
    console.info(req.body);
    const refreshToken = req.body.refreshToken as string;
    


    if (refreshToken === null) {
        return res.sendStatus(401);
    }
    // const user = req.body.user;


    // verify refresh token is valid from prisma database.
    const refreshTokenPrisma = await prisma.refreshTokens.findFirst({
        where: {
            token: refreshToken,
        }
    })
    console.log('Refresh token found:',  refreshTokenPrisma);

    if( refreshTokenPrisma === null) {
        return res.sendStatus(403);
    }


    // if prisma refresh token is valid, then generate new token
        try {

            console.log('creating new token');
            // const token = jwt.sign(user, SECRET_JWT_KEY, { expiresIn: '1h' });
            const accessToken = generateToken({ username: user.username }, SECRET_JWT_KEY, '1h');
            console.log('new token created');
            console.log('accessToken:', accessToken);
            
            // const refreshToken = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
            const refreshToken = generateToken({ username: user.username }, SECRET_JWT__REFRESH_KEY, '7d');
            console.log('refreshToken:', refreshToken);
    
            //add refresh token to prisma database
            const refreshTokenPrisma = await prisma.refreshTokens.create({
                data: {
                    token: refreshToken,
                    user: {
                        connect: {
                            username: user.username
                        }
                    }
                }
            })
    
            console.log('refresh token added: ', refreshTokenPrisma);
            // refreshTokens.push(refreshToken);
            res.json({
                'message': 'token refreshed',
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
        }
        catch (err) {
            res.status(500).send(err);
        }
});

//     if (refreshTokens.indexOf(refreshToken) === -1) {
//         return res.sendStatus(403);
//     }

//     if (refreshToken.includes(req.body.refreshToken)) {
//         const user = {
//             username: req.body.user.username,
//         }
//         try {
//             // const token = jwt.sign(user, SECRET_JWT__REFRESH_KEY, { expiresIn: '7d' });
//             // const token = generateToken(user, SECRET_JWT__REFRESH_KEY, '7d');
//             const accessToken = generateToken({ username: user.username }, SECRET_JWT_KEY, '1h');
//             res.json({
//                 accesstoken: accessToken,
//             });
//         }
//         catch (err) {
//             res.status(500).send(err);
//         }
//     }
// }
// );



// middleware
function generateToken(user: any, secret: string, expiresIn: string) {
    return jwt.sign(user, secret, { expiresIn: expiresIn });
}

function authenicateToken(req: Request, res: Response, next: Function) {
    const authHeader = req.headers['authorization'];
    console.info(req.body);

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