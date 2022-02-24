const contractIDs = {
    "multicall": {
        "mainnet": "multicall.near",
        "testnet": "multicall.testnet"
    },
    "wNEAR": {
        "mainnet": "wrap.near",
        "testnet": "wrap.testnet"
    },
    "ref-finance": {
        "mainnet": "v2.ref-finance.near",
        "testnet": "ref-finance.testnet"
    },
    "example": {
        "mainnet": "foo.near",
        "testnet": "bar.testnet"
    }
};

export default function getContractID(key) {

    if (window.ENVIRONMENT === undefined)
        window["ENVIRONMENT"] = new URL(window.location.href).searchParams.has("testnet")
            ? "testnet"
            : "mainnet"

    return contractIDs[key][window.ENVIRONMENT];

}