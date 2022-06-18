class Persistent {

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

}

window["STORAGE"] = new Persistent();

export {}