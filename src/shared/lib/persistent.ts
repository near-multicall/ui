import { initialData } from "../../initial-data";
import debounce from "lodash.debounce";

const STORAGE_KEY_ADDRESSES = "multicall_addresses";
const STORAGE_KEY_JSON = "multicall_json";

// Singleton for storing + persisting addresses and layout on local storage.
class Persistent {
    // addresses relevant to multicall interactions. Initialize with empty strings.
    addresses: { user: string; multicall: string; dao: string } = { user: "", multicall: "", dao: "" };
    // TODO: type layout
    layout: object = JSON.parse(JSON.stringify(initialData));

    constructor() {
        // try initializing with values from local storage
        let storedAddresses = localStorage.getItem(STORAGE_KEY_ADDRESSES);
        this.addresses = storedAddresses ? JSON.parse(storedAddresses) : this.addresses;
    }

    setAddresses = debounce(
        // debounced function
        (newAddresses: { user?: string; multicall?: string; dao?: string }) => {
            this.addresses = {
                ...this.addresses,
                ...newAddresses,
            };

            document.dispatchEvent(
                new CustomEvent("onaddressesupdated", {
                    detail: {
                        ...this.addresses,
                    },
                })
            );
        },
        // delay in ms
        100
    );

    setLayout(newLayout: any) {
        this.layout = {
            ...this.layout,
            ...JSON.parse(JSON.stringify(newLayout)),
        };

        document.dispatchEvent(
            new CustomEvent("onlayoutupdated", {
                detail: {
                    ...this.layout,
                },
            })
        );
    }

    save() {
        if (window.SIDEBAR.getPage() !== "app") return;

        localStorage.setItem(STORAGE_KEY_ADDRESSES, JSON.stringify(this.addresses));
        localStorage.setItem(STORAGE_KEY_JSON, JSON.stringify(window.LAYOUT.toBase64()));
        // localStorage.setItem("multicall_layout", JSON.stringify(this.layout));
    }

    load() {
        this.setAddresses(JSON.parse(localStorage.getItem(STORAGE_KEY_ADDRESSES) ?? "{}"));
        window.LAYOUT?.fromBase64(JSON.parse(localStorage.getItem(STORAGE_KEY_JSON) ?? "[]"));
        // this.setLayout(JSON.parse(localStorage.getItem("multicall_layout") ?? "{}"));
    }
}

const STORAGE = new Persistent();

export { STORAGE };
