import { Big, BigSource } from "big.js";
import { parseExpression, ParserOptions } from "cron-parser";
import { Validation } from "./validation";

// config for Big.js behavior. see: https://mikemcl.github.io/big.js/
Big.RM = Big.roundDown;
Big.DP = 40;
Big.NE = -40;
Big.PE = 40;

export type unit = "NEAR" | "yocto" | "Tgas" | "gas";

const unitToDecimals: Record<unit, number> = {
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

const convert = (amount: string | number, unit: unit, decimals?: number): number | string => {
    decimals = decimals ?? unitToDecimals[unit];

    return decimals !== undefined && Validation.isSimpleNumberStr(amount.toString())
        ? parseTokenAmount((amount === "" ? "0" : amount).toString(), decimals)
        : amount;
};

// Cron helper methods. We Follow croncat format, see: https://github.com/CronCats/Schedule
// JS Date to cron expression.
const dateToCron = (date: Date): string => {
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();
    const days = date.getUTCDate();
    const months = date.getUTCMonth() + 1; // JS months are 0-11. Cron needs 1-12
    const year = date.getUTCFullYear();

    // TODO: use year when the time is right.
    return `0 ${minutes} ${hours} ${days} ${months} * *`;
};
// Cron expression to JS Date.
const cronToDate = (cronStr: string): Date => {
    const fields = cronStr.split(" ");
    const options: ParserOptions = { utc: true };
    if (fields.length === 7) {
        // remove and save the 7th field (years).
        const year = Number(fields.pop()!);
        if (Number.isInteger(year)) {
            // restrict cron-parser to chosen year. Format follows ISO 8601.
            options.currentDate = `${year}-01-01T00:00:00`; // first moment of "year"
            options.endDate = `${year}-12-31T23:59:59`; // last moment of "year"
        }
    }
    const interval = parseExpression(fields.join(" "), options);
    // TODO: check timezone of returned Date (unlcear whether UTC or client time)
    return interval.next().toDate();
};

// convert file to base64 data URI
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result !== "string") return resolve("");
            else return resolve(reader.result);
        };
        reader.onerror = (error) => reject(error);
    });
};

// Create Blob file from URL
const dataUrlToBlob = (dataUri: string): Blob => {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = window.atob(dataUri.split(",")[1]);
    // separate out the mime component
    var mimeString = dataUri.split(",")[0].split(":")[1].split(";")[0];
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
};

const dataUrlToFile = (dataUrl: string, fileName: string): File => {
    const blobObj = dataUrlToBlob(dataUrl);
    return new File([blobObj], fileName);
};

export {
    unitToDecimals,
    parseTokenAmount,
    formatTokenAmount,
    removeTrailingZeros,
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert,
    Big, // re-export Big.js to preserve library config
    dateToCron,
    cronToDate,
    fileToDataUrl,
    dataUrlToFile,
};
