import { RedisClient } from 'redis'


type dbCallback = (sk: string) => any

export interface MFADbProvider {
    saveUserSecretKey(secretKey: string, user: string, cb: (err: Error) => any)
    getUserSecretKey(user: string, cb: dbCallback)
}

export class MFALocalDB implements MFADbProvider {
    secretKeys: Map<string, string> = new Map<string, string>()

    saveUserSecretKey(secretKey: string, user: string, cb: (err: Error) => any) {
        this.secretKeys.set(user, secretKey)
        cb(null)
    }

    getUserSecretKey(user: string, cb: dbCallback) {
        cb(this.secretKeys.get(user))
    }
}

export class MFARedisDB implements MFADbProvider {
    private redisClient: RedisClient

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient
    }

    saveUserSecretKey(secretKey: string, user: string, cb: (err: Error) => any) {
        this.redisClient.set(user, secretKey, (err: Error, reply) => {
            if (err) {
                cb(err)
            }
            cb(null)
        })
    }

    // getUserSecretKey gets secretKey for user from redis
    getUserSecretKey(user: string, cb: dbCallback) {
        this.redisClient.get(user, (err: Error, reply) => {
            cb(reply)
        })
    }

}