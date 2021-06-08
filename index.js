const {
  KEYGEN_VERIFY_KEY,
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID,
} = process.env

const fetch = require('node-fetch')
const crypto = require('crypto')
const chalk = require('chalk')

// There is likely a third-party module for this, but we want to show
// how to parse the signature header without one.
function parseParameterizedHeader(header) {
  if (header == null) {
    return null
  }

  const params = header.split(/\s*,\s*/g)
  const keyvalues = params.map(param => {
    const [, key, value] = param.match(/([^=]+)="([^"]+)"/i)

    return [key, value]
  })

  return keyvalues.reduce(
    (o, [k, v]) => (o[k] = v, o),
    {}
  )
}

// Encode hexadecimal key into DER format, since Node's crypto module doesn't
// accept keys in hex format. This is all a bit magical, but it creates a
// buffer of bytes according to the DER spec. There are likely third-party
// modules for this.
function encodeHexKeyToDerFormat(hex) {
  const oid = Buffer.from([0x06, 0x03, 0x2B, 0x65, 0x70]) // Ed25519 oid
  const key = Buffer.from(hex, 'hex')
  const elements = Buffer.concat([
    Buffer.concat([
      Buffer.from([0x30]), // Sequence tag
      Buffer.from([oid.length]),
      oid,
    ]),
    Buffer.concat([
      Buffer.from([0x03]), // Bit tag
      Buffer.from([key.length + 1]),
      Buffer.from([0x00]), // Zero bit
      key,
    ]),
  ])

  const der = Buffer.concat([
    Buffer.from([0x30]), // Sequence tag
    Buffer.from([elements.length]),
    elements,
  ])

  return der
}

async function main() {
  const route = process.argv[2] || ''
  const uri = `/v1/accounts/${KEYGEN_ACCOUNT_ID}/${route.replace(/^\//, '')}`
  const res = await fetch(`https://api.keygen.sh/${uri.replace(/^\//, '')}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      'Accept': 'application/vnd.api+json',
    }
  })

  // Get the response body so we can use it for verifying its signature
  const body = await res.text()

  // Parse and verify the response signature
  try {
    // Parse the signature header
    const header = parseParameterizedHeader(res.headers.get('Keygen-Signature'))
    if (header == null) {
      console.error(
        chalk.red(`Signature is missing`)
      )

      process.exit(1)
    }

    // Extract the algorithm and signature from the header
    const { algorithm, signature } = header

    // Ensure signing algorithm is what we expect
    if (algorithm !== 'ed25519') {
      console.error(
        chalk.red(`Algorithm did not match: ${algorithm}`)
      )

      process.exit(1)
    }

    // Verify integrity
    const hash = crypto.createHash('sha256').update(body)
    const digest = `sha-256=${hash.digest('base64')}`
    if (digest !== res.headers.get('Digest')) {
      console.error(
        chalk.red(`Digest did not match: ${digest}`)
      )

      process.exit(1)
    }

    // Reconstruct the signing data
    const date = res.headers.get('Date')
    const data = [
      `(request-target): get ${uri}`,
      `host: api.keygen.sh`,
      `date: ${date}`,
      `digest: ${digest}`,
    ].join('\n')

    // Initialize our public key
    const verifyKey = crypto.createPublicKey({
      key: encodeHexKeyToDerFormat(KEYGEN_VERIFY_KEY),
      format: 'der',
      type: 'spki',
    })

    // Decode and verify the signature
    const signatureBytes = Buffer.from(signature, 'base64')
    const dataBytes = Buffer.from(data)
    const ok = crypto.verify(null, dataBytes, verifyKey, signatureBytes)
    if (!ok) {
      throw new Error('invalid signature')
    }
  } catch (e) {
    console.error(
      chalk.red(`Signature did not match: ${e.message}`)
    )

    process.exit(1)
  }

  // Handle request normally
  const { meta, data, links, errors } = JSON.parse(body)
  if (errors) {
    console.warn(
      chalk.yellow(JSON.stringify({ errors }, null, 2))
    )

    process.exit(1)
  }

  console.log(
    chalk.green(JSON.stringify({ meta, data, links }, null, 2))
  )

  process.exit(0)
}

main()
