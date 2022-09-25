import { Big, BigSource } from "big.js";
import { parseExpression, ParserOptions } from "cron-parser";

// config for Big.js behavior. see: https://mikemcl.github.io/big.js/
Big.RM = Big.roundDown;
Big.DP = 40;
Big.NE = -40;
Big.PE = 40;

const unitToDecimals: Record<string, number> = {
    NEAR: 24,
    yocto: 0,
    Tgas: 12,
    gas: 0,
};

// only match basic integers & flaots. Reject exponentials, scientific notations ...
const SIMPLE_NUM_REGEX: RegExp = /^\d+(\.\d+)?$/;

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

const convert = (amount: string | number, unit: string, decimals?: number): number | string => {
    decimals = decimals ?? unitToDecimals[unit];

    return decimals !== undefined && SIMPLE_NUM_REGEX.test(amount.toString())
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

    return `0 ${minutes} ${hours} ${days} ${months} * ${year}`;
};
// Cron expression to JS Date.
const cronToDate = (cronStr: string): Date => {
    const fields = cronStr.split(" ");
    let year = 0;
    const options: ParserOptions = { utc: true };
    if (fields.length === 7) {
        // remove and save the 7th field (years).
        year = parseInt(fields.pop()!);
        // restrict cron-parser to chosen year. Format follows ISO 8601.
        options.currentDate = `${year}-01-01T00:00:00`; // first moment of "year"
        options.endDate = `${year}-12-31T23:59:59`; // last moment of "year"
    }
    const interval = parseExpression(fields.join(" "), options);
    // TODO: check timezone of returned Date (unlcear whether UTC or client time)
    return interval.next().toDate();
};

export {
    unitToDecimals,
    SIMPLE_NUM_REGEX,
    parseTokenAmount,
    formatTokenAmount,
    toTGas,
    toGas,
    toNEAR,
    toYocto,
    convert,
    Big, // re-export Big.js to preserve library config
    dateToCron,
    cronToDate,
};
