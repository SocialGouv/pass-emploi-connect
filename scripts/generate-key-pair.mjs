import { exportJWK, generateKeyPair } from 'jose'

const res = await generateKeyPair('RS256')
const jwkPrivate = await exportJWK(res.privateKey)
console.log(JSON.stringify(jwkPrivate))
