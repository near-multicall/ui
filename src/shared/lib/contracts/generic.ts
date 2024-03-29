import { viewAccount } from "../wallet";

/**
 * check if there's a contract deployed on given NEAR address.
 * Accounts without contract have code_hash '11111111111111111111111111111111'.
 *
 * @param {string} address
 */
async function hasContract(address: string): Promise<boolean> {
    const accountInfo = await viewAccount(address);
    const codeHash: string = accountInfo.code_hash;
    return codeHash !== "11111111111111111111111111111111";
}

// TODO: method to list all available functions from a contract

export { hasContract };
