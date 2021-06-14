import { MFADbProvider } from "./db"

/*
// SET MFA
    When user request to enable 2-factor authentication
    Generate a secret key of length 20.secretKey = generateSecretKey(20);
    Save that secret key in database for this particular user.saveUserSecretKey(userId, secretKey);
    convert that secret key into qr image.qrCode = convertToQrCode(secretKey);
    send the qr image as responseresponse(qrCode);

USE MFA: 
    User types the code displayed in the application.
    Fetch secret key from database.secretKey = getSecretKeyOfUser(userId);
    if (codeTypedByUser == getHOTP(secretKey, currentUnixTime / 30)) {   enableTwoFactorAuthentication(userId);}
*/

export default class MFAProvider {
    dbProvider: MFADbProvider

    private readonly secretKeyLength: number = 20

    constructor(dbProvider: MFADbProvider) {
        this.dbProvider = dbProvider
    }

    private generateSecretKey(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result
    }

    // generateSecretKeyForUser generates user's secret key and stores it in DB
    generateSecretKeyForUser(user: string): string {
        const sk = this.generateSecretKey(this.secretKeyLength);

        this.dbProvider.saveUserSecretKey(sk, user);
        return sk;
    }

    // generateTOTP get's user secret key and current timestamp 
    // and uses cryptographic function to create 6-digit password
    generateTOTP(): string {
        return ""
    }
}


