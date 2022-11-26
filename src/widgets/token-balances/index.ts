import { TokenBalancesUI } from "./ui/token-balances";
import { TokenBalances as TokenBalancesModule } from "./context";

class TokenBalances {
    static UI = TokenBalancesUI;
}

export { TokenBalances, type TokenBalancesModule };
