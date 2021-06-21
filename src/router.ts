import express, { Router } from 'express';
import { toDataURL } from 'qrcode'
import { User } from './auth/db';
import AuthProvider from './auth/registration';
import MFAProvider from './mfa/mfa';

export abstract class CommonRoutesConfig {
    protected readonly app: express.Application;
    protected readonly mfa: MFAProvider;
    protected readonly name: string;
    protected readonly auth: AuthProvider;

    constructor(app: express.Application, mfa: MFAProvider, auth: AuthProvider, name: string) {
        this.app = app;
        this.name = name;
        this.mfa = mfa;
        this.auth = auth;
        this.configureRoutes();
    }

    public getName() {
        return this.name;
    }

    public abstract configureRoutes(): express.Application;
}

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application, mfa: MFAProvider, auth: AuthProvider) {
        super(app, mfa, auth, 'UsersRoutes');
    }

    public configureRoutes() {
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

        this.app.route('/mfa/:user/totp')
            .post((req: express.Request, res: express.Response) => {
                const user = req.params.user;

                this.mfa.generateTOTP(user, (totp: number) => {
                    if (totp) {
                        res.status(200).send({ 'totp': totp })
                    } else {
                        res.status(500).send({ 'error': "Failed to generate TOTP for that user" })
                    }
                })
            })

        this.app.route('/mfa/:user/validate')
            .post((req: express.Request, res: express.Response) => {
                const user = req.params.user;
                const totp = req.body.totp;

                this.mfa.validateTOTP(user, totp, (valid: boolean) => {
                    if (valid) {
                        res.status(200).send({ 'valid': valid })
                    } else {
                        res.status(401).send({ 'error': "Invalid TOTP" })
                    }
                })
            })

        this.app.route('/qr')
            .get((req: express.Request, res: express.Response) => {
                toDataURL('some text', { errorCorrectionLevel: 'H' }, function (err, url) {
                    console.log(url)
                })
            })

        // AUTH ENDPOINTS
        this.app.route('/register')
            .post((req: express.Request, res: express.Response) => {
                const username = req.body.username;
                const password = req.body.password;

                const user: User = this.auth.createUser(username, password)

                res.status(200).json(user)
            })

        this.app.route('/login')
            .post((req: express.Request, res: express.Response) => {
                const username = req.body.username;
                const password = req.body.password;

                this.auth.checkPassword(username, password, (valid: boolean) => {
                    res.status(valid ? 200 : 400).send({ 'logged': valid })
                })
            })

        return this.app;
    }
}