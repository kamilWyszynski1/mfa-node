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

    createUser(username: string, password: string): User {
        return this.db.saveUser(username, this.encode(password))
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
}