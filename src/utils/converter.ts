import { Big } from 'big.js';


// config for Big.js behavior. see: https://mikemcl.github.io/big.js/
Big.RM = 0;
Big.DP = 40;
Big.NE = -40;
Big.PE = 40;

const removeTrailingZeros = (amount: string): string => amount.replace(/\.?0*$/, '');
// token amount -> indivisible units
const parseTokenAmount = (amount: number | string, decimals: number): string => Big(amount).times(Big(10).pow(decimals)).toFixed();
// indivisible units -> token amount
const formatTokenAmount = (amount: number | string, decimals: number, precision: number): string => {
    const formattedAmount: string = Big(amount).div(Big(10).pow(decimals)).toFixed(precision);
    return removeTrailingZeros(formattedAmount);
}

const toTGas = (amount: string | number): number => parseInt( formatTokenAmount(amount, 12, 12) ); 
const toGas = (amount: string | number): number => parseInt( parseTokenAmount(amount, 12) );

// yocto -> NEAR
const toNEAR = (amount: string | number): string => formatTokenAmount(amount.toString(), 24, 24);
// NEAR -> yocto
const toYocto = (amount: string | number): string => parseTokenAmount(amount.toString(), 24);

const convert = (amount: string | number, unit: string, decimals?: number): number | string => {
    // empty string considered 0
    amount === "" ? "0" : amount

    decimals = decimals ?? {
        NEAR: 24,
        yocto: 0,
        Tgas: 12,
        gas: 0
    }[unit]

    return decimals !== undefined && /^\d*(\.\d*)?$/.test(amount.toString())
        ? parseTokenAmount((amount).toString(), decimals)
        : amount;

}

export {
    parseTokenAmount,
    formatTokenAmount,
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert
}