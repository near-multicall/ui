import { formatNearAmount, parseNearAmount } from 'near-api-js/src/utils/format';

const oneNEAR = BigInt("1000000000000000000000000");

const toTGas = (gas: string | number) => parseFloat(gas.toString()) * 1e-12; 

const toGas = (Tgas: string | number) => parseFloat(Tgas.toString()) * 1e12;

const toNEAR = (yocto: string | number) => formatNearAmount(yocto.toString());

const toYocto = (NEAR: string | number) => parseNearAmount(NEAR.toString());

const convert = (value: string | number, unit: string) => { 

    const val = typeof value === "string" 
        ? BigInt(value).toString() 
        : value;

    switch(unit) {

        case "Tgas":
            return toGas(val);

        case "NEAR":
            return toYocto(val);

        default:
            return val;

    }

}

export {
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert
}