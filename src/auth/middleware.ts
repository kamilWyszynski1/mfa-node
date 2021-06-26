import express from "express"
import AuthProvider from "./registration"


// export default (auth: AuthProvider): (req: express.Request, res: express.Response, next: express.NextFunction)  {
//     return null
// }

export default (auth: AuthProvider): (req: express.Request, res: express.Response, next: express.NextFunction) => any => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const sessionToken: string = req.get('session')

        if (!sessionToken) {
            res.status(401).send({ error: 'no session token' })
        } else {
            auth.validateSession(sessionToken, (valid: boolean) => {
                if (valid) {
                    next()
                } else {
                    res.status(401).send({ error: 'session token invalid' })
                }
            })
        }
    }
}

