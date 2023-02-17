

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
