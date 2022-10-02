import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./facet.scss";

const _Facet = "Facet";

export interface FacetProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Facet = ({ children, className }: FacetProps) => <div className={clsx(_Facet, className)}>{children}</div>;
