# Example Signature Verification
This is an example of [verifying response signatures](https://keygen.sh/docs/api#signatures)
using your Keygen account's unique Ed25519 public key. You can find your public keys
within [your account's settings page](https://app.keygen.sh/settings).

Verifying response signatures will help prevent man-in-the-middle and replay
attacks, where the attacker redirects traffic from your licensing server
(e.g. Keygen) to their own locally controlled server. Other examples are
when you have cached an API response locally and want to verify its integrity
(i.e. it has not been tampered with).

## Running the example

First up, configure a few environment variables:

```bash
# Your Keygen account's Ed25519 verify key
export KEYGEN_VERIFY_KEY="YOUR_KEYGEN_ED25519_VERIFY_KEY"

# Keygen product token (don't share this!)
export KEYGEN_PRODUCT_TOKEN="YOUR_KEYGEN_PRODUCT_TOKEN"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):

```
yarn
```

Then run the script with the route you want to fetch:

```
yarn start '/licenses/442160c6-20d2-44a7-883d-245e38f651fd'
yarn start '/users/dbe63060-eee7-4c87-98fa-f133fb8131fa'
yarn start '/machines?page[number]=1&page[size]=5'
```

The above commands will only succeed if the signature verification is
successful, so be sure to copy your public key correctly. You can find
your public key within [your account's settings page](https://app.keygen.sh/settings).

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!
