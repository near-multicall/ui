const errorMsg: { [index: string]: string } = {
    // base task errors
    ERR_INVALID_ADDR: "Invalid address",
    ERR_INVALID_FUNC: "Cannot be empty",
    ERR_INVALID_ARGS: "Invalid JSON",
    ERR_INVALID_GAS_AMOUNT: "Amount out of bounds",
    ERR_INVALID_DEPO_AMOUNT: "Amount out of bounds",
    ERR_NO_DAO_ON_ADDR: "No sputnik dao found at address",
    ERR_DAO_HAS_NO_MTCL: "Dao does not have a multicall instance",
    ERR_CANNOT_PROPOSE_TO_DAO: "No permission to create a proposal on this dao",
};

export { errorMsg };
