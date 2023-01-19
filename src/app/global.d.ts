import { Account, NetworkId } from "@near-wallet-selector/core";
import { Component } from "react";

import { Task, TaskCardCopy, TaskCardInfo, Wallet } from "../entities";
import { EditTask } from "../features";
import { AppPage } from "../pages/app";
import { Sidebar } from "../widgets";

declare global {
    /* Temporary workaround fixing typechecking with assets import */
    declare module "*.png";
    declare module "*.svg";
    declare module "*.jpeg";
    declare module "*.jpg";

    /**
     * Function arguments inference
     */
    declare type Arguments<F extends Function> = F extends (...args: infer A) => any ? A : never;

    /**
     * String encoded number (u128)
     */
    declare type U128String = string;

    /**
     * String encoded number (u64)
     */
    declare type U64String = string;

    declare type JsonString = string;

    /**
     * Base64 encoded JSON
     */
    declare type Base64String = string;

    /**
     * NEAR Protocol account ID
     */
    declare type AccountId = Account["accountId"];

    interface Window {
        EXPORT: Component;
    }
}
