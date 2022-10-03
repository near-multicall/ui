export class DappLoginConfig {
    static KEYS = {
        all: "ed25519%3A9jeqkc8ybv7aYSA7uLNFUEn8cgKo759yue4771bBWsSr",
        public: "ed25519%3ADEaoD65LomNHAMzhNZva15LC85ntwBHdcTbCnZRXciZH",
    };

    static METHODS: Record<"dao" | "multicall", { title: string; type: keyof typeof DappLoginConfig.METHODS }> = {
        dao: { title: "Login in dApps as DAO", type: "dao" },
        multicall: { title: "Login in dApps as Multicall", type: "multicall" },
    };

    static STEP_BY_STEP_GUIDE = [
        {
            text: "Open the dApp in another browser tab",
        },
        {
            text: "Log out your account on the dApp",
            hint: "You should not be logged in with any wallet on the other dApp, otherwise this won't work.",
        },
        {
            text: "Copy the dApp's URL",
        },
        {
            text: "Paste the URL in the input field below",
        },
        {
            text: 'Click "Proceed"',
            hint: 'This opens the dApp in a new tab, with a "watch-only" mode. Meaning you cannot sign transactions with it',
        },
    ];
}
