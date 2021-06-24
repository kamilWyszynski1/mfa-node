import { MFADbProvider } from "./db"

import { createHash, createHmac } from 'crypto'

/*
// SET MFA
    When user request to enable 2-factor authentication
    Generate a secret key of length 20.secretKey = generateSecretKey(20)
    Save that secret key in database for this particular user.saveUserSecretKey(userId, secretKey)
    convert that secret key into qr image.qrCode = convertToQrCode(secretKey)
    send the qr image as responseresponse(qrCode)

USE MFA: 
    User types the code displayed in the application.
    Fetch secret key from database.secretKey = getSecretKeyOfUser(userId)
    if (codeTypedByUser == getHOTP(secretKey, currentUnixTime / 30)) {   enableTwoFactorAuthentication(userId)}
*/

type mfaCallback = (sk: string) => any

const TOTP_WINDOW = 30 // 30s time window for proper key
const numberOfDigitsRequiredInOTP = 6

export default class MFAProvider {
    dbProvider: MFADbProvider

    private readonly secretKeyLength: number = 20

    constructor(dbProvider: MFADbProvider) {
        this.dbProvider = dbProvider
    }

    private generateSecretKey(length: number): string {
        let result = ''
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const charactersLength = characters.length
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
    }

    // generateSecretKeyForUser generates user's secret key and stores it in DB
    generateSecretKeyForUser(user: string, cb: (err: Error) => any) {
        // check if secret key for that user exists
        this.dbProvider.getUserSecretKey(user, (sk: string) => {
            if (sk) {
                cb(new Error("Secret key for that user already exists"))
            }
        });

        const sk = this.generateSecretKey(this.secretKeyLength)

        this.dbProvider.saveUserSecretKey(sk, user, (err: Error) => {
            if (err) {
                cb(err)
            }
            cb(null)
        })
    }


    // getSecretKeyForUser returns secret key for user
    // only for debuging purposes
    getSecretKeyForUser(user: string, cb: mfaCallback) {
        this.dbProvider.getUserSecretKey(user, (sk: string) => {
            cb(sk)
        });

    }

    // generateTOTP get's user secret key and current timestamp 
    // and uses cryptographic function to create 6-digit password
    generateTOTP(user: string, cb: (totp: number) => any) {
        this.getSecretKeyForUser(user, (sk: string) => {
            const hmacSHA1 = createHmac("sha1", sk);
            const counter: string = Math.floor(+new Date / 1000 / TOTP_WINDOW).toString();
            const hmacHash: string = hmacSHA1.update(counter).digest('hex');

            let offset: number = hmacHash.charCodeAt(hmacHash.length - 1) & 0xf;
            const truncatedHash: number = (hmacHash.charCodeAt(offset++) & 0x7f) << 24 | (hmacHash.charCodeAt(offset++) & 0xff) << 16 | (hmacHash.charCodeAt(offset++) & 0xff) << 8 | (hmacHash.charCodeAt(offset++) & 0xff);

            console.log(`counter: ${counter}, hash: ${hmacHash}, offset: ${offset}, trunc: ${truncatedHash}`);

            cb(+truncatedHash.toString().substr(0, numberOfDigitsRequiredInOTP));
        })
    }

    validateTOTP(user: string, totp: number, cb: (valid: boolean) => any) {
        console.log(`received totp: ${totp}`)

        this.generateTOTP(user, (generatedTOTP: number) => {
            cb(totp == generatedTOTP)
        })

    }
}


