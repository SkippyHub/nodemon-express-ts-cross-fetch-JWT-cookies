
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