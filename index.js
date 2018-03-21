const {
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID,
  KEYGEN_PUBLIC_KEY
} = process.env

const fetch = require('node-fetch')
const NodeRSA = require('node-rsa')
const crypto = require('crypto')
const chalk = require('chalk')

async function main() {
  const rsa = new NodeRSA(KEYGEN_PUBLIC_KEY)
  const route = process.argv[2] || ''

  const res = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/${route}`, {
    headers: {
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      'Accept': 'application/vnd.api+json'
    }
  })

  // Get the response body so we can use it for validating the signature
  const body = await res.text()

  const { meta, data, links, errors } = JSON.parse(body)
  if (errors) {
    console.error(
      chalk.red(JSON.stringify({ errors }, null, 2))
    )

    return
  }

  // Validate the signature of the response using our public key
  const sig = res.headers.get('X-Signature')
  try {
    const v = rsa.verify(body, Buffer.from(sig, 'base64'))
    if (!v) {
      throw new Error('Signature does not match')
    }
  } catch (e) {
    console.error(
      chalk.red(`Signature did not match: ${sig}`)
    )

    return
  }

  console.log(
    chalk.green(JSON.stringify({ meta, data, links }, null, 2))
  )
}

main()