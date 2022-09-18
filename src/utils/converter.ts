import { Big, BigSource } from "big.js";
import { Validation } from "./validation";

// config for Big.js behavior. see: https://mikemcl.github.io/big.js/
Big.RM = Big.roundDown;
Big.DP = 40;
Big.NE = -40;
Big.PE = 40;

const unitToDecimals: Record<string, number> = {
    NEAR: 24,
    yocto: 0,
    Tgas: 12,
    gas: 0,
};

const removeTrailingZeros = (amount: string): string => amount.replace(/\.?0*$/, "");
// token amount -> indivisible units
const parseTokenAmount = (amount: BigSource, decimals: number): string =>
    Big(amount).times(Big(10).pow(decimals)).toFixed();
// indivisible units -> token amount
const formatTokenAmount = (amount: BigSource, decimals: number = 0, precision: number = Big.DP): string => {
    const formattedAmount: string = Big(amount).div(Big(10).pow(decimals)).toFixed(precision);
    return removeTrailingZeros(formattedAmount);
};

const toTGas = (amount: string): string => formatTokenAmount(amount, 12, 12);
const toGas = (amount: string): string => parseTokenAmount(amount, 12);

// yocto -> NEAR
const toNEAR = (amount: string | number): string => formatTokenAmount(amount.toString(), 24, 24);
// NEAR -> yocto
const toYocto = (amount: string | number): string => parseTokenAmount(amount.toString(), 24);

const convert = (amount: string | number, unit: string, decimals?: number): number | string => {
    decimals = decimals ?? unitToDecimals[unit];

    return decimals !== undefined && Validation.isSimpleNumberStr(amount.toString())
        ? parseTokenAmount((amount === "" ? "0" : amount).toString(), decimals)
        : amount;
};

export {
    unitToDecimals,
    parseTokenAmount,
    formatTokenAmount,
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert,
    Big, // re-export Big.js to preserve library config
};
