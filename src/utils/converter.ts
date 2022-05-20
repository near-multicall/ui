import { utils } from 'near-api-js';
import { Gas } from 'near-units';
import Big from 'big.js';

Big.DP = 24;
Big.RM = Big.roundDown;
Big.NE = -24;
Big.PE = 1e6;

const { formatNearAmount, parseNearAmount } = utils.format;

const toSmall = (large: string, decimals: number = 0): string => (Big(large).times(Big(10).pow(decimals))).toString();
const toLarge = (small: string, decimals: number = 0): string => (Big(small).div(Big(10).pow(decimals)).toString());

const toTGas = (gas: string | number): number => parseFloat(gas.toString()) * 1e-12; 
const toGas = (TGas: string | number): number => parseInt( Gas.parse(`${TGas} TGas`).toString() );

const toNEAR = (yocto: string | number): string => formatNearAmount(yocto.toString());
const toYocto = (NEAR: string | number): string => parseNearAmount(NEAR.toString());

const convert = (value: string | number, unit: string, decimals?: number): number | string => {

    decimals = decimals ?? {
        NEAR: 24,
        yocto: 0,
        Tgas: 12,
        gas: 0
    }[unit]

    return decimals !== undefined && /^\d*(\.\d*)?$/.test(value.toString())
        ? toSmall((value === "" ? "0" : value).toString(), decimals)
        : value;

}

const unitToDecimals = (unit: string): number => ({
        NEAR: 24,
        yocto: 0,
        Tgas: 12,
        gas: 0
    }[unit])

export {
    toSmall,
    toLarge,
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert,
    unitToDecimals
}