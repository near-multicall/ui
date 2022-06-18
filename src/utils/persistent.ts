export class Persistent {

    addresses = {
        user: "",
        multicall: "",
        dao: ""
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

    save() {
        localStorage.setItem("multicall_addresses", JSON.stringify(this.addresses))
    }

    load() {
        this.setAddresses(JSON.parse(localStorage.getItem("multicall_addresses") ?? "{}"))
    }

}

window.STORAGE = new Persistent();