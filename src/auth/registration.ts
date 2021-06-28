import { createHmac } from "crypto";
import { AuthDBProvider, User } from "./db";

export default class AuthProvider {
    db: AuthDBProvider
    secret: string

    constructor(db: AuthDBProvider, secret: string) {
        this.db = db
        this.secret = secret
    }

    private encode(password: string): string {
        return createHmac('sha256', this.secret).update(password).digest('base64')
    }

    createUser(username: string, password: string, cb: (registered: boolean) => void): User {
        return this.db.saveUser(username, this.encode(password), (u: User) => {
            if (u) {
                cb(true)
            } else {
                cb(false)
            }
        })
    }

    checkPassword(username: string, password: string, cb: (valid: boolean) => any) {
        this.db.getUser(username, (u: User) => {
            if (!u) {
                cb(false)
            }
            const passwordHash: string = this.encode(password)

            cb(u.passwordHash == passwordHash)
        })
    }

    login(username: string, cb: (token: string) => void) {
        const token: string = `${username}:token`;

        this.db.saveSession(username, token)
        cb(token)
    }

    validateSession(sessionToken: string, cb: (valid: boolean) => void) {
        const username: string = sessionToken.split(':')[0]
        const token: string = sessionToken.split(':')[1]

        console.log(`validating session for: ${sessionToken}`);

        this.db.getSession(username, (dbToken: string) => {
            console.log(`token from db: ${dbToken}, valid: ${dbToken == sessionToken}`);

            cb(dbToken == sessionToken)
        })
    }

    getUser(username: string, cb: (u: User) => any) {
        this.db.getUser(username, (u: User) => {
            cb(u)
        })
    }
}