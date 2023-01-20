import { AccountState, WalletSelector, setupWalletSelector } from "@near-wallet-selector/core";
import { WalletSelectorModal, setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import myNearWalletIconUrl from "@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import nearWalletIconUrl from "@near-wallet-selector/near-wallet/assets/near-wallet-icon.png";
import { setupSender } from "@near-wallet-selector/sender";
import senderIconUrl from "@near-wallet-selector/sender/assets/sender-icon.png";
import { FC, useCallback, useEffect, useState } from "react";
import { map, distinctUntilChanged } from "rxjs";

import { Multicall } from "../../../shared/lib/contracts/multicall";
import { WalletContext } from "../wallet.service";

export const WalletContextProvider: FC<any> = ({ children }) => {
    const [selector, setSelector] = useState<WalletSelector | null>(null);
    const [modal, setModal] = useState<WalletSelectorModal | null>(null);
    const [accounts, setAccounts] = useState<Array<AccountState>>([]);

    const init = useCallback(async () => {
        const _selector = await setupWalletSelector({
            network: window.NEAR_ENV,

            modules: [
                setupNearWallet({ iconUrl: nearWalletIconUrl }),
                setupSender({ iconUrl: senderIconUrl }),
                setupMyNearWallet({ iconUrl: myNearWalletIconUrl }),
            ],
        });

        const _modal = setupModal(_selector, {
            contractId: Multicall.FACTORY_ADDRESS,
            theme: "dark",
        });

        const state = _selector.store.getState();

        setAccounts(state.accounts);

        window.selector = _selector;
        window.modal = _modal;

        setSelector(_selector);
        setModal(_modal);
    }, []);

    useEffect(() => {
        init().catch((err) => {
            console.error(err);
            alert("Failed to initialize wallet selector");
        });
    }, [init]);

    useEffect(() => {
        if (!selector) {
            return;
        }

        const subscription = selector.store.observable
            .pipe(
                map((state) => state.accounts),
                distinctUntilChanged()
            )
            .subscribe((nextAccounts) => setAccounts(nextAccounts));

        return () => subscription.unsubscribe();
    }, [selector]);

    if (!selector || !modal) {
        return null;
    }

    const accountId = accounts.find((account) => account.active)?.accountId || null;

    return (
        <WalletContext.Provider
            value={{
                selector,
                modal,
                accounts,
                accountId,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};
