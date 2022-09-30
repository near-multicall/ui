import clsx from "clsx";
import { HTMLAttributes, PropsWithChildren } from "react";

import "./card.scss";

const _Card = "Card";

export interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export const Card = ({ children, className }: CardProps) => <div className={clsx(_Card, className)}>{children}</div>;
