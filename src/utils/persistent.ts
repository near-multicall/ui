import debounce from 'lodash.debounce';

class Persistent {

    addresses = {
        user: "",
        multicall: "",
        dao: ""
    }

    setAddresses = debounce((newAddresses) => {

        this.addresses = {
            ...this.addresses,
            ...newAddresses
        }
        
        window["TASKS"]?.map(t => t.instance.current.onAddressesUpdated());
        window["MENU"]?.forceUpdate();
        window["DAO"]?.onAddressesUpdated();
        window["EXPORT"]?.onAddressesUpdated();

    }, 100);

}

window["STORAGE"] = new Persistent();