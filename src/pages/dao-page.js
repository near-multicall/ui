import React from 'react';
import { Dao, Sidebar } from '../components.js';

export default function DaoPage() {

    window.PAGE = "dao";

    // TODO: remove "full" prop
    return(
        <>
            <Sidebar full={true} />
            <Dao />
        </>
    );

}
