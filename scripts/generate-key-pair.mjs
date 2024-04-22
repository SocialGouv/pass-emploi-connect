import { exportJWK, generateKeyPair } from 'jose'

const res = await generateKeyPair('ES384')
const jwkPrivate = await exportJWK(res.privateKey)
console.log(JSON.stringify(jwkPrivate))
