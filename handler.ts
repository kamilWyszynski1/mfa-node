import serverless from "serverless-http";
import express from 'express';
import { MFARedisDB } from './src/mfa/db';
import MFAProvider from './src/mfa/mfa';

import { createClient, RedisClient } from 'redis';
import * as expressWinston from 'express-winston';
import * as winston from 'winston';

const app: express.Application = express();

const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true })
  ),
};

app.use(express.json());
app.use(expressWinston.logger(loggerOptions));

const isLocal: boolean = process.argv[2] === 'LOCAL';


app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});


let redisClient: RedisClient;
if (isLocal) {
  redisClient = createClient('6379')
} else {
  redisClient = createClient('redis://auth-redis.cb8xna.0001.use1.cache.amazonaws.com');
}
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
