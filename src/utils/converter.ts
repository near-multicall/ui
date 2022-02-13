import { formatNearAmount, parseNearAmount } from 'near-api-js/src/utils/format';

const oneNEAR = BigInt("1000000000000000000000000");

const toTGas = (gas: string | number) => parseFloat(gas.toString()) * 1e-12; 

const toGas = (Tgas: string | number) => parseFloat(Tgas.toString()) * 1e12;

const toNEAR = (yocto: string | number) => formatNearAmount(yocto.toString());

const toYocto = (NEAR: string | number) => parseNearAmount(NEAR.toString());

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