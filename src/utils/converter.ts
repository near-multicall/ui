import { utils } from 'near-api-js';
import { Gas } from 'near-units';


const { formatNearAmount, parseNearAmount } = utils.format;

const oneNEAR = BigInt("1000000000000000000000000");

const toTGas = (gas: string | number): number => parseFloat(gas.toString()) * 1e-12; 

const toGas = (TgasAmount: string | number): number => parseInt( Gas.parse(`${TgasAmount} TGas`).toString() );

const toNEAR = (yocto: string | number): string => formatNearAmount(yocto.toString());

const toYocto = (NEAR: string | number): string => parseNearAmount(NEAR.toString());

const convert = (value: string | number, unit: string) => { 

    switch(unit) {

        case "Tgas":
            return toGas(value);

        case "NEAR":
            return toYocto(value);

        default:
            return value;

    }

}

export {
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert
}