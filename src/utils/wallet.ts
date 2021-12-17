import { connect, keyStores, WalletConnection } from 'near-api-js';
import getConfig from '../config';

window.ENVIRONMENT = 'mainnet';

function initWallet() {
    return new Promise(resolve => {
        connect({
            ...getConfig(ENVIRONMENT || 'development'),
            keyStore: new keyStores.BrowserLocalStorageKeyStore()
        }).then(near => resolve(new WalletConnection(near, 'near-multicall')));
    });
}

export { initWallet };