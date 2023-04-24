import nearWalletIconUrl from "@near-wallet-selector/near-wallet/assets/near-wallet-icon.png";
import senderIconUrl from "@near-wallet-selector/sender/assets/sender-icon.png";
import myNearWalletIconUrl from "@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png";
import ledgerIconUrl from "@near-wallet-selector/ledger/assets/ledger-icon.png";
import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupSender } from "@near-wallet-selector/sender";
import React, { useCallback, useEffect, useState } from "react";
import { map, distinctUntilChanged } from "rxjs";

import { Multicall } from "../../../shared/lib/contracts/multicall";

declare global {
    interface Window {
        selector: WalletSelector;
        modal: WalletSelectorModal;
    }
}

interface WalletSelectorContextValue {
    selector: WalletSelector;
    modal: WalletSelectorModal;
    accounts: Array<AccountState>;
    accountId: string | null;
}

export const WalletSelectorContext = React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC<any> = ({ children }) => {
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
                setupLedger({ iconUrl: ledgerIconUrl }),
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
            .subscribe((nextAccounts) => {
                console.log("Accounts Update", nextAccounts);

                setAccounts(nextAccounts);
            });

        return () => subscription.unsubscribe();
    }, [selector]);

    if (!selector || !modal) {
        return null;
    }

    const accountId = accounts.find((account) => account.active)?.accountId || null;

    return (
        <WalletSelectorContext.Provider
            value={{
                selector,
                modal,
                accounts,
                accountId,
            }}
        >
            {children}
        </WalletSelectorContext.Provider>
    );
};

export const tryWalletSelectorContext = () => {
    if (!WalletSelectorContext) {
        throw new Error("tryWalletSelectorContext must be used within a WalletSelectorContextProvider");
    }

    return WalletSelectorContext;
};
