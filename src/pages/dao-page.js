import React from 'react';
import { Dao, Sidebar } from '../components.js';

export default function DaoPage() {

    // TODO: remove "full" prop
    return(
        <>
            <Sidebar full={true} />
            <Dao />
        </>
    );

}