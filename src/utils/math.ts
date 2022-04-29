function multiply(a: bigint, b: string): bigint {

    if (a === 0n)
        return 0n;

    if (!b.includes("."))
        return a * BigInt(b);

    const d = b.split(".")[1].length;
    const b_x_d = BigInt(b.split(".").join(""));

    const a_x_b_x_d = a * b_x_d;
    const a_x_b = BigInt(a_x_b_x_d.toString().slice(0, -d))

    return a_x_b

}

// https://github.com/adrianhelvik/divide-bigint/blob/master/cjs/index.js
function divide(a: bigint, b: bigint): number {
    let div = a / b;
    return parseFloat(div.toString()) + parseFloat((a - div * b).toString()) / parseFloat(b.toString());
}

const longStr = (x: number | string) => { 
    if (typeof x === "string") return x;
    x.toLocaleString('fullwide', {
        useGrouping: false, 
        minimumFractionDigits: 20
    });
}

const B_mul_N = (big: bigint, num: number | string): bigint => multiply(big, longStr(num))

const B_div_N = (big: bigint, num: number): bigint => multiply(big, longStr(1 / num));

const B_div_B = (big_enum: bigint, big_deno: bigint): number => divide(big_enum, big_deno);


export {
    B_mul_N,
    B_div_N,
    B_div_B
}