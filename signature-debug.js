const crypto = require("crypto");
// Simulate standard Node.js crypto used in my code
const secret = "fjVIfL/J+5gKP76VZBZR0XWgPydHHVYXrltv0lUL9i4=";
const token = "b325251a304918e001ac032c58a36d29630cce89fa1237a3c306d87042a969f6";
const mySign = crypto.createHmac("sha256", secret).update(token).digest("base64");
console.log("My Signature:", mySign);

// Simulate WebCrypto used in better-call
async function webCryptoSign() {
  const { webcrypto } = crypto;
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await webcrypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(token)
  );
  const b64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  console.log("WebCrypto Signature:", b64);
  console.log("Match:", mySign === b64);
}
webCryptoSign();
