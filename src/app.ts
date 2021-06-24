import express from 'express';


import * as http from 'http';

// import cors from 'cors';
import debug from 'debug';
import * as expressWinston from 'express-winston';
import * as winston from 'winston';

import { MFARedisDB } from './mfa/db';
import MFAProvider from './mfa/mfa';
import { CommonRoutesConfig, UsersRoutes } from './router';

import { createClient, RedisClient } from 'redis';
import AuthProvider from './auth/registration';
import { RedisAuthDB } from './auth/db';

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port: number = 3000;
const routes: CommonRoutesConfig[] = [];
const debugLog: debug.IDebugger = debug('app');


const redisClient: RedisClient = createClient('redis://rediscachev1.eypl9h.ng.0001.usw1.cache.amazonaws.com');

const mfa: MFAProvider = new MFAProvider(new MFARedisDB(redisClient))
const auth: AuthProvider = new AuthProvider(new RedisAuthDB(redisClient), "secretKey")

// here we are adding middleware to parse all incoming requests as JSON
app.use(express.json());

// here we are adding middleware to allow cross-origin requests
// app.use(cors());

// here we are preparing the expressWinston logging middleware configuration,
// which will automatically log all HTTP requests handled by Express.js
const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        winston.format.prettyPrint(),
        winston.format.colorize({ all: true })
    ),
};

if (!process.env.DEBUG) {
    loggerOptions.meta = false; // when not debugging, log requests as one-liners
}

// initialize the logger with the above configuration
app.use(expressWinston.logger(loggerOptions));

// here we are adding the UserRoutes to our array,
// after sending the Express.js application object to have the routes added to our app!
routes.push(new UsersRoutes(app, mfa, auth));

// this is a simple route to make sure everything is working properly
const runningMessage = `Server running at http://localhost:${port}`;
app.get('/', (_req: express.Request, res: express.Response) => {
    res.status(200).send(runningMessage)
});


if (process.env.AWS) {
    exports.handler = async function (event, context) {
        console.log("EVENT: \n" + JSON.stringify(event, null, 2))
        return context.logStreamName
    }
} else {
    server.listen(port, () => {
        routes.forEach((route: CommonRoutesConfig) => {
            debugLog(`Routes configured for ${route.getName()}`);
        });
        // our only exception to avoiding console.log(), because we
        // always want to know when the server is done starting up
        console.log(runningMessage);
    });
}

