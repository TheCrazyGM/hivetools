#!/usr/bin/env python3
from getpass import getpass
from pprint import pprint

from beem import Steem
from beem.account import Account
from beem.wallet import Wallet

active_wif = getpass(prompt="Active key: ")

hv = Steem(node="http://anyx.io", keys=[active_wif])
w = Wallet(steem_instance=hv)
usr = w.getAccountFromPrivateKey(active_wif)
a = Account(usr, steem_instance=hv)
deleg = a.get_vesting_delegations()
for x in deleg:
    delegatee = x["delegatee"]
    print(f"[Dropping delegation to {delegatee} to 0]")
    pprint(a.delegate_vesting_shares(delegatee, 0))
