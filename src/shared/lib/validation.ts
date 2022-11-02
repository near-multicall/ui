const isUrl = (urlString: string): boolean => {
    try {
        return Boolean(new URL(urlString));
    } catch {
        return false;
    }
};

/**
 * Check if a string is a valid NEAR account id.
 *
 * @param accountId
 */
const isNearAccountId = (accountId: string): boolean => {
    // Regexp for NEAR account IDs. See: https://github.com/near/nearcore/blob/180e5dda991ad7bdbb389a931e84d24e31fb0674/core/account-id/src/lib.rs#L240
    const ACCOUNT_ID_REGEX: RegExp = /^(?=.{2,64}$)(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
    return ACCOUNT_ID_REGEX.test(accountId);
};

/**
 * only returns true on integers & floats. Reject exponentials, scientific notations ...
 *
 * @param numberStr string of a number
 */
const isSimpleNumberStr = (numberStr: string): boolean => {
    const SIMPLE_NUM_REGEX: RegExp = /^\d+(\.\d+)?$/;
    return SIMPLE_NUM_REGEX.test(numberStr);
};

function isDataURL(s: string): boolean {
    const DATA_URL_REGEX = /^(data:)([\w\/\+-]*)(;charset=[\w-]+|;base64){0,1},(.*)/gi;
    return !!s.match(DATA_URL_REGEX);
}

export const Validation = { isUrl, isNearAccountId, isSimpleNumberStr, isDataURL };
