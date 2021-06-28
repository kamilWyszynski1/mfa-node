import serverless from "serverless-http";
import express from 'express';
import { MFARedisDB } from './src/mfa/db';
import MFAProvider from './src/mfa/mfa';

import { createClient, RedisClient } from 'redis';
import * as expressWinston from 'express-winston';
import * as winston from 'winston';
import { User } from "./src/auth/db";
import { RedisAuthDB } from "./src/auth/db";
import AuthProvider from "./src/auth/registration";
import createMiddleware from './src/auth/middleware';

console.log('express init');
const app: express.Application = express();
console.log('express initalized');

const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true })
  ),
};

app.use(express.json());
// app.use(expressWinston.logger(loggerOptions));

const isLocal: boolean = process.argv[2] === 'LOCAL';

console.log('redis init');
let redisClient: RedisClient;
if (isLocal) {
  redisClient = createClient('6379')
} else {
  redisClient = createClient(process.env.REDIS_URL);
}
console.log('redis initalized');
//redis://auth-redis.cb8xna.0001.use1.cache.amazonaws.com


redisClient.ping((err: Error, reply: string) => {
  console.log(`ping response: ${err}, ${reply}`);
})


// redisClientSub.config('set', 'notify-keyspace-events', 'KEA')
// redisClientSub.subscribe('__keyevent@0__:expired');
// // you can target a specific key with a second parameter
// // example, client_redis.subscribe('__keyevent@0__:set', 'mykey')

// redisClientSub.on('message', function (channel, key) {
//   console.log(channel, key);
// });

console.log('mfa init');

const mfa: MFAProvider = new MFAProvider(new MFARedisDB(redisClient))

app.get('/mfa/:user', (req: express.Request, res: express.Response) => {
  const user = req.params.user;

  mfa.getSecretKeyForUser(user, (sk: string) => {
    if (sk) {
      res.status(200).send({ 'secretKey': sk })
    } else {
      res.status(404).send({ 'error': "There's no data for that user" })
    }
  })
})

app.post('/mfa/:user', (req: express.Request, res: express.Response) => {
  const user = req.params.user;
  mfa.generateSecretKeyForUser(user, (err: Error) => {
    if (err) {
      res.status(404).send({ 'error': err.message })
    } else {
      res.status(201).send()
    }
  })
})

const auth: AuthProvider = new AuthProvider(new RedisAuthDB(redisClient), "secretKey")
const sessionMiddleware = createMiddleware(auth)

app.post('/user/register', (req: express.Request, res: express.Response) => {
  const username = req.body.username;
  const password = req.body.password;

  auth.createUser(username, password, (registered: boolean) => {
    if (registered) {
      res.status(201).send({ username: username, password: password })
    } else {
      res.status(400).send({ error: 'failed to register' })
    }
  })

})

app.post('/user/login', (req: express.Request, res: express.Response) => {
  const username = req.body.username;
  const password = req.body.password;

  auth.checkPassword(username, password, (valid: boolean) => {
    auth.login(username, (t: string) => {
      if (valid) {
        res.status(200).send({ token: t })
      } else {
        res.status(400).send({ error: 'invalid password' })
      }
    })
  })
})

app.get('/user/:username', (req: express.Request, res: express.Response) => {
  const username = req.params.username;

  auth.getUser(username, (u: User) => {
    res.status(200).json(u)
  })
})

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

if (isLocal) {
  console.log('running locally')
  const port: number = 3000;
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
} else {
  module.exports.handler = serverless(app);
}
