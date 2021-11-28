const oneNEAR = BigInt("1000000000000000000000000");

const toTGas = gas => gas * 1e-12; 

const toGas = Tgas => Tgas * 1e12;

const toNEAR = (yocto: string | number) => (BigInt(yocto) * oneNEAR).toString();

const toYocto = (NEAR: string | number) => (BigInt(NEAR) / oneNEAR).toString();

export {
    toTGas,
    toGas,
    toNEAR,
    toYocto
}