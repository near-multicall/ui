const oneNEAR = BigInt("1000000000000000000000000");

const toTGas = gas => gas * 1e-12; 

const toGas = Tgas => Tgas * 1e12;

const toNEAR = (yocto: string | number) => (BigInt(yocto) / oneNEAR).toString();

const toYocto = (NEAR: string | number) => (BigInt(NEAR) * oneNEAR).toString();

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