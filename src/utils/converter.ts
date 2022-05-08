import { utils } from 'near-api-js';
import { Gas } from 'near-units';
import { ArgsBig } from './args';
import { B_div_B, B_mul_N, isValidBigIntSyntax } from './math'


const { formatNearAmount, parseNearAmount } = utils.format;

const toSmall = (big: number | string, decimals: number): bigint => B_mul_N(BigInt("1" + "0".repeat(decimals)), big);
const toLarge = (small: bigint, decimals: number): number => B_div_B(small, BigInt("1" + "0".repeat(decimals)))

const toTGas = (gas: string | number): number => parseFloat(gas.toString()) * 1e-12; 
const toGas = (TGas: string | number): number => parseInt( Gas.parse(`${TGas} TGas`).toString() );

const toNEAR = (yocto: string | number): string => formatNearAmount(yocto.toString());
const toYocto = (NEAR: string | number): string => parseNearAmount(NEAR.toString());

const convert = (value: string | number, unit: string, decimals?: number): number | string => {

    switch(unit) {

        case "Tgas":
            return toGas(value);

        case "NEAR":
            return toYocto(value);

        default:
            return decimals !== undefined && isValidBigIntSyntax(value.toString())
                ? (toSmall((value === "" ? "0" : value).toString(), decimals)).toString()
                : value;

    }

}

export {
    toSmall,
    toLarge,
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert
}