/*
const isUrl = (urlString: string) =>
    Boolean(
        new RegExp(
            // validate protocol
            "^(https?:\\/\\/)?" +
                // validate domain name
                "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
                // validate OR ip (v4) address
                "((\\d{1,3}\\.){3}\\d{1,3}))" +
                // validate port and path
                "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
                // validate query string
                "(\\?[;&a-z\\d%_.~+=-]*)?" +
                // validate fragment locator
                "(\\#[-a-z\\d_]*)?$",
            "i"
        ).test(urlString)
    );
		*/

const isUrl = (urlString: string) => {
    try {
        return Boolean(new URL(urlString));
    } catch {
        return false;
    }
};

export const Validation = { isUrl };
