
<p align="center"><h1 align="center">
  mosquitopay-shimmer-charge-package
</h1>

<p align="center">
  
</p>

<p align="center">
  <a href="https://www.npmjs.org/package/mosquitopay-shimmer-charge-package"><img src="https://badgen.net/npm/v/mosquitopay-shimmer-charge-package" alt="npm version"/></a>
  <a href="https://www.npmjs.org/package/mosquitopay-shimmer-charge-package"><img src="https://badgen.net/npm/license/mosquitopay-shimmer-charge-package" alt="license"/></a>
  <a href="https://www.npmjs.org/package/mosquitopay-shimmer-charge-package"><img src="https://badgen.net/npm/dt/mosquitopay-shimmer-charge-package" alt="downloads"/></a>
  <!-- <a href="https://github.com/mosquitopay/mosquitopay-shimmer-charge-package/actions?workflow=CI"><img src="https://github.com/mosquitopay/mosquitopay-shimmer-charge-package/workflows/CI/badge.svg" alt="build"/></a> -->
  <a href="https://codecov.io/gh/mosquitopay/mosquitopay-shimmer-charge-package"><img src="https://badgen.net/codecov/c/github/mosquitopay/mosquitopay-shimmer-charge-package" alt="codecov"/></a>
  <!-- <a href="https://snyk.io/test/github/mosquitopay/mosquitopay-shimmer-charge-package"><img src="https://snyk.io/test/github/mosquitopay/mosquitopay-shimmer-charge-package/badge.svg" alt="Known Vulnerabilities"/></a> -->
  <a href="./SECURITY.md"><img src="https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg" alt="Responsible Disclosure Policy" /></a>
</p>

# About



# Install

```bash
yarn add mosquitopay-shimmer-charge-package
```

# Usage

```js
import createCharge from 'mosquitopay-shimmer-charge-package'
```

# Example

<!-- TODO -->
```js
import createCharge from 'mosquitopay-shimmer-charge-package'
import express from 'express'
import { readFileSync } from 'fs'

const app = express()
const port = 3000
const privateKey = readFileSync('./private.pem')
const publicKey = readFileSync('./public.pem')

let shimmerExchange = 200 // exchange shimmer coin for euro = 200 shimmer/euro

app.use(express.json())
app.get('/charge', (req, res) => {
  const bodyOrder = req.body
  const cartString = req.body.metadata.cart
  return createCharge(publicKey, bodyOrder, cartString, shimmerExchange)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

```

# Author

**mosquitopay-shimmer-charge-package** © [mosquitopay](https://github.com/mosquitopay), Released under the [Apache-2.0](./LICENSE) License.
