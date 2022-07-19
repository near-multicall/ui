import { initialData } from '../initial-data.js'

export class Persistent {
    static STORAGE_KEY_ADDRESSES = "multicall_addresses";
    static STORAGE_KEY_JSON = "multicall_json";

    addresses = {
        user: "",
        multicall: "",
        dao: ""
    }

    layout = {
        ...initialData
    }

    setAddresses(newAddresses: {
        user?: string,
        multicall?: string,
        dao?: string
    }) {

        this.addresses = {
            ...this.addresses,
            ...newAddresses
        }
        
        document.dispatchEvent(new CustomEvent('onaddressesupdated', {
            detail: {
                ...this.addresses
            }
        }))
        
    }

    // TODO type layout
    setLayout(newLayout: any) {

        this.layout = {
            ...this.layout,
            ...newLayout
        }

        document.dispatchEvent(new CustomEvent('onlayoutupdated', {
            detail: {
                ...this.layout
            }
        }))

    }

    save() {
        if (window.PAGE !== "app") return;

        localStorage.setItem(Persistent.STORAGE_KEY_ADDRESSES, JSON.stringify(this.addresses));
        localStorage.setItem(Persistent.STORAGE_KEY_JSON, JSON.stringify(window.LAYOUT.toJSON()));
        // localStorage.setItem("multicall_layout", JSON.stringify(this.layout));
    }

    load() {
        this.setAddresses(JSON.parse(localStorage.getItem(Persistent.STORAGE_KEY_ADDRESSES) ?? "{}"));
        window.LAYOUT?.fromJSON(JSON.parse(localStorage.getItem(Persistent.STORAGE_KEY_JSON) ?? "[]"));
        // this.setLayout(JSON.parse(localStorage.getItem("multicall_layout") ?? "{}"));
    }

}

window.STORAGE = new Persistent();