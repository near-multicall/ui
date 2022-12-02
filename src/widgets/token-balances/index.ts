import { TokenBalancesUI } from "./ui/token-balances";
import { TokenBalances as TokenBalancesModule } from "./module-context";

class TokenBalances {
    static UI = TokenBalancesUI;
}

export { TokenBalances, type TokenBalancesModule };
