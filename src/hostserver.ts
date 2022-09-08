//https://stackoverflow.com/questions/59437626/express-vhost-dynamic-subdomains
// import express app json
import express from 'express';
import vhost from 'vhost';

import jwt from 'jsonwebtoken';
import cookies from 'cookie'
import cookieParser from "cookie-parser";
import cors from 'cors';



const config = require("./config.json");
const domains = require("./domains.json");


const domain = config.server.domain;
const port = config.server.port;
var subdomains = domains.localhost.subdomains

console.log(domains)
console.log(domains.localhost.subdomains)


// constants
const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY as string;
const SECRET_JWT__REFRESH_KEY = process.env.SECRET_JWT__REFRESH_KEY as string;


let app = express();

app.use(cookieParser());
app.use(cors(
    {
        // origin: "http://localhost"
        origin: "*",
        credentials: true,

    }
))

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
    res.setHeader("Authorization", "Bearer " + cookie);
    next(); // <-- important!
  });

// console.info(JSON.stringify(domains))


/*
vhost model,
1. on start create express app for each existing in database
2. on update push item to database and add express app to memory queue.
*/
subdomains.forEach((subdomain: string, domain?: string) => {
    // const subDir = `${subdomainDir}/${subdomain}/`;

    // if(domain === undefined) {
    //     domain = domain
    // )

    let subExpress = express();


    subExpress.get('/', function (req, res) {
        // console.dir(req)
        res.send(`Hello from ${subdomain}.${domain} <a href="http://${domain}:${domains.localhost.port}">home</a>`);
    }
    );
    subExpress.get('/blog', function (req, res) {
        res.send(`Hello from ${subdomain}.${domain}'s blog`);

    });
    // subExpress.use(express.static(__dirname + subDir));

    app.use(vhost(`${subdomain}.${domain}`, subExpress));
});


function createsubdomain(subdomain: string ) {

    // filter if subdomain exists in database return false
    console.log(`creating subdomain ${subdomain}`)
    if(domains.localhost.subdomains.find((e: string) =>e === subdomain)) {
        console.log(`${subdomain} already exists`)
        return;
    }

    let subExpress = express();


    console.log(`${subdomain}.${domain}`)

    subExpress.get('/', function (req, res) {
        // console.dir(req)
        res.send(`Hello from ${subdomain}.${domain} <a href="http://${domain}:${domains.localhost.port}">home</a>`);
    }
    );
    subExpress.get('/blog', function (req, res) {
        res.send(`Hello from ${subdomain}.${domain}'s blog`);

    });
    // subExpress.use(express.static(__dirname + subDir));

    app.use(vhost(`${subdomain}.${domain}`, subExpress));
    domains.localhost.subdomains.push(subdomain)
}

function updateUnusedSubdomains() {
// let unusedSub = express();

// unusedSub.get('*', (req, res) => {
//     console.log("unusedSub");
//     res.send(`Hello from ${domain}`);
// });
}



let www = express();
import bodyParser from 'body-parser';
www.use(bodyParser.json());
www.use('/', express.static('public'))

www.get('/domains', function (req, res) {
    // console.dir(req)
    res.status(200).send(domains);
}
);
www.post('/submit', function (req, res) {

    if(req.headers.authorization ) {
        console.log("authorization", req.headers.authorization)
    }
    if(req.cookies.cookieName ) {
       console.log("cookie :" + req.cookies.cookieName);
       if(req.headers.authorization === "Bearer " + req.cookies.cookieName) {
           console.log("authorized");
        //    res.status(200).send("authorized");
       }
    }
    if(req.body.subdomain && req.body.subdomain != ""){
        const createSubDomain = createsubdomain(req.body.subdomain)
    }
    res.sendStatus(200);
}
);

// app.use(vhost(`*.${domain}`, unusedSub));
app.use(vhost(`${domain}`, www));

// app.listen(port, () => console.log(`Listening on port http://${domain}:${port}.`));

app.listen(config.server.Port, () => {
    console.log(`Listening on port http://${config.server.domain}:${config.server.Port} ...`);
  });