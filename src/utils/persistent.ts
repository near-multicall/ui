class Persistent {

    addresses = {
        user: "",
        multicall: "",
        dao: ""
    }

    setAddresses(newAddresses) {

        this.addresses = {
            ...this.addresses,
            ...newAddresses
        }
        window["TASKS"]?.map(t => t.instance.current.onAddressesUpdated());
        window["MENU"]?.forceUpdate();
        window["DAO"]?.onAddressesUpdated();

    }

}

window["STORAGE"] = new Persistent();