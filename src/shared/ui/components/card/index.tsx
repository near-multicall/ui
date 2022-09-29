import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./index.scss";

const CardNamespace = "Card";

export interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Card = ({ children, className }: CardProps) => (
    <div className={clsx(CardNamespace, className)}>{children}</div>
);
