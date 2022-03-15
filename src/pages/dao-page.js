import React, {ReactElement} from 'react';
import { Dao } from '../components.js';
import { ArgsAccount, ArgsNumber, ArgsJSON, ArgsObject, ArgsString, ArgsBig, ArgsArray } from '../utils/args';

export default function DaoPage() {

    const test = {
        string: new ArgsString("hello"),
        account: new ArgsAccount("lennczar.near"),
        number: new ArgsNumber(123),
        big: new ArgsBig("123"),
        object: new ArgsObject(new Object()),
        array: new ArgsArray(),
        json: new ArgsJSON("{}")
    };

    return <div>Potato</div>

}