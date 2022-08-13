

# Barebones nodemon express server with cross-fetch and cookies.
This has a dockerhub v2 api fetch as an example to get you started.

use nvm,npm (latest, *16*), pnpm! 
 
nvm manages node versions,
pnpm manages packages from npm.

 https://github.com/nvm-sh/nvm
 ```bash
 curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
 ```
 https://github.com/pnpm/pnpm
 
  ```bash
 npm install -g pnpm
 ```
create a .env file (copy .env.example) 
```bash
USERNAME=<YOUR DOCKER USERNAME>
PASSWORD=<YOUR DOCKER PASSWORD>
```

then run:
```bash
pnpm i && pnpm run start
```

dependencies: 
+ cookie: "^0.5.0",
+ cookie-parser: "^1.4.6",
+ cors: "^2.8.5",
+ cross-fetch: "^3.1.5",
+ dotenv: "^16.0.1",
+ express: "^4.18.1",
+ jsonwebtoken: "^8.5.1"

devDependencies: 
+ @types/cookie: "^0.5.1",
+ @types/cookie-parser: "^1.4.3",
+ @types/cors: "^2.8.12",
+ @types/express: "^4.17.13",
+ @types/jsonwebtoken: "^8.5.8",
+ @types/node: "^18.7.2",
+ @typescript-eslint/eslint-plugin: "^5.33.0",
+ @typescript-eslint/parser: "^5.33.0",
+ eslint: "^8.21.0",
+ nodemon: "^2.0.19",
+ ts-node: "^10.9.1",
+ typescript: "^4.7.4"
