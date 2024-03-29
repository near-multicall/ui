# NEAR Multicall

Multicall is a tool for DAOs that allows proposal creators to bundle multiple cross-contract calls in one proposal.
You may find more information on the project [here](https://github.com/near-multicall/contracts).

---

## Multicall UI

This repository contains graphical user interface application for building [multicalls](https://github.com/near-multicall/contracts).
Try it out at [NEAR Mainnet](https://multicall.app) or [NEAR Testnet](https://testnet.multicall.app)

---

### Development

#### Quick start

##### Install dependencies

```sh
npm install
```

##### Run development server

For **NEAR Testnet**:

```sh
npm run start:testnet
```

For **NEAR Mainnet**:

```sh
npm run start:mainnet
```

#### Architectural specification

This application's architecture applies [Feature-Sliced Design](https://Feature-Sliced.Design/) principles.
