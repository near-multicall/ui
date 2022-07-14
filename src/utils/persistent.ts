import debounce from 'lodash.debounce';
import { initialData } from '../initial-data.js'

class Persistent {

    addresses = {
        user: "",
        multicall: "",
        dao: ""
    }

    layout = {
        ...initialData
    }

    setAddresses = debounce((newAddresses: {
        user?: string,
        multicall?: string,
        dao?: string
    }) => {

        this.addresses = {
            ...this.addresses,
            ...newAddresses
        }
        
        document.dispatchEvent(new CustomEvent('onaddressesupdated', {
            detail: {
                ...this.addresses
            }
        }))
        
    }, 100);

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

        localStorage.setItem("multicall_addresses", JSON.stringify(this.addresses));
        localStorage.setItem("multicall_json", JSON.stringify(window.LAYOUT.toJSON()));
        // localStorage.setItem("multicall_layout", JSON.stringify(this.layout));
    }

    load() {
        this.setAddresses(JSON.parse(localStorage.getItem("multicall_addresses") ?? "{}"));
        window.LAYOUT?.fromJSON(JSON.parse(localStorage.getItem("multicall_json") ?? "[]"));
        // this.setLayout(JSON.parse(localStorage.getItem("multicall_layout") ?? "{}"));
    }

}

window.STORAGE = new Persistent();