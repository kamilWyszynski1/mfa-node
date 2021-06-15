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
        this.app.route('/mfa/:user')
            .get((req: express.Request, res: express.Response) => {
                const user = req.params.user;

                this.mfa.getSecretKeyForUser(user, (sk: string) => {
                    if (sk) {
                        res.status(200).send({ 'secretKey': sk })
                    } else {
                        res.status(404).send({ 'error': "There's no data for that user" })
                    }
                })
            })
            .post((req: express.Request, res: express.Response) => {
                const user = req.params.user;
                this.mfa.generateSecretKeyForUser(user, (err: Error) => {
                    if (err) {
                        res.status(404).send({ 'error': err.message })
                    } else {
                        res.status(201).send()
                    }
                })
            })
        // (we'll add the actual route configuration here next)
        return this.app;
    }
}