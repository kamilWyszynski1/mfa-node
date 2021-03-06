import { errorLogger } from "express-winston"
import { RedisClient } from "redis"
import { promisify } from "util"

export interface User {
    username: string
    passwordHash: string
}


export interface AuthDBProvider {
    saveUser(username: string, passwordHash: string, cb: (u: User) => void)
    getUser(username: string, cb: (u: User) => any)
    saveSession(username: string, token: string): void
    getSession(username: string, cb: (token: string) => void)
}

// export class LocalAuthDB implements AuthDBProvider {
//     users: Map<string, User> = new Map<string, User>()


//     saveUser(username: string, passwordHash: string): User {
//         const user: User = {
//             passwordHash: passwordHash,
//             username: username,
//         }
//         this.users.set(user.username, user)

//         return user
//     }

//     getUser(username: string): User {
//         return this.users.get(username)
//     }
// }

export class RedisAuthDB implements AuthDBProvider {
    private redisClient: RedisClient

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient

    }

    saveUser(username: string, passwordHash: string, cb: (u: User) => void) {
        this.redisClient.set(username, passwordHash, (err: Error, reply: string) => {
            console.log(`db saveuser: ${err}, ${reply}`)
            if (err) {
                cb(null)
            } else {
                cb({ username: username, passwordHash: passwordHash })
            }
        })
    }

    getUser(username: string, cb: (u: User) => any) {
        this.redisClient.get(username, (err: Error, hash: string) => {
            if (err) {
                cb(null)
            } else {
                cb({ username: username, passwordHash: hash })
            }
        })
    }

    saveSession(username: string, token: string): void {
        this.redisClient.setex(`token:${username}`, 3000, token, (err: Error, reply: string) => { console.log(`db savesession: ${err}, ${reply}`) })
    }

    getSession(username: string, cb: (token: string) => void) {
        this.redisClient.get(`token:${username}`, (err: Error, token: string) => {
            console.log(`getsession: ${err}, ${token}`)
            if (err) {
                cb('')
            } else {
                cb(token)
            }
        })
    }

}