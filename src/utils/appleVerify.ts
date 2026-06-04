import jwt, { JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { envVars } from "../app/config/env";

// Apple JWKS client
const client = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  timeout: 30000, // optional but recommended
});

//  Get signing key from Apple
function getKey(header: JwtHeader, callback: any) {
  if (!header.kid) {
    return callback(new Error("Missing kid in token header"), null);
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err, null);
    }
    if (!key) {     
      return callback(new Error("No signing key found"), null);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

//  Verify Apple ID Token
export const verifyAppleToken = (idToken: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      //  Decode without verifying (for debugging)
      const decodedPreview = jwt.decode(idToken, { complete: true });
      jwt.verify(
        idToken,
        getKey,
        {
          issuer: "https://appleid.apple.com",
          algorithms: ["RS256"],
          audience: envVars.APPLE_AUTH?.APPLE_CLIENT_ID,
        },
        (err, decoded) => {
          if (err) {
            return reject(err);
          }
          resolve(decoded);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};