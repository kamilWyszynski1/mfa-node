export interface MFADbProvider {
    saveUserSecretKey(secretKey: string, user: string)
    getUserSecretKey(user: string): string
}

export class MFALocalDB implements MFADbProvider {
    secretKeys: Map<string, string> = new Map<string, string>()

    saveUserSecretKey(secretKey: string, user: string) {
        this.secretKeys.set(user, secretKey)
    }

    getUserSecretKey(user: string): string {
        return this.secretKeys.get(user);
    }
}