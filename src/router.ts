import express from 'express';
import MFAProvider from './mfa/mfa';

export abstract class CommonRoutesConfig {
    app: express.Application;
    mfa: MFAProvider;
    name: string;

    constructor(app: express.Application, mfa: MFAProvider, name: string) {
        this.app = app;
        this.name = name;
        this.mfa = mfa;
        this.configureRoutes();
    }
    getName() {
        return this.name;
    }
    abstract configureRoutes(): express.Application;
}

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application, mfa: MFAProvider) {
        super(app, mfa, 'UsersRoutes');
    }

    configureRoutes() {
        this.app.get('/', (req, res) => {
            res.send('The sedulous hyena ate the antelope!');
        });

        this.app.get('/mfa/:user', (req: express.Request, res: express.Response) => {
            const user = req.params.user;

            res.status(200).send(this.mfa.generateSecretKeyForUser(user))
        });
        // (we'll add the actual route configuration here next)
        return this.app;
    }
}