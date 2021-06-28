import { createClient } from "redis";
import { RedisAuthDB } from "../auth/db";
import AuthProvider from "../auth/registration";

const redisClient = createClient(process.env.REDIS_URL);
const auth: AuthProvider = new AuthProvider(new RedisAuthDB(redisClient), "secretKey")


module.exports.authorize = function (event, context, callback) {
    var token = event.authorizationToken;

    if (!token) {
        callback("Unauthorized");
        return;
    } else {
        auth.validateSession(token, (valid: boolean) => {
            if (valid) {
                callback(null, generatePolicy('user', 'Allow', event.methodArn));
            } else {
                callback("Unauthorized");

            }
        })
    }
}

// Help function to generate an IAM policy
var generatePolicy = function (principalId, effect, resource) {
    var authResponse: any = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument: any = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        var statementOne: any = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = {
        "stringKey": "stringval",
        "numberKey": 123,
        "booleanKey": true
    };
    return authResponse;
}