#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "beem",
#     "python-dotenv",
# ]
# ///

import os
from pprint import pprint

from beem import Hive
from beem.account import Account
from beem.wallet import Wallet
from dotenv import load_dotenv

load_dotenv()
active_wif = os.getenv("ACTIVE_WIF")

hv = Hive(node="https://api.hive.blog", keys=[active_wif])
w = Wallet(blockchain_instance=hv)
usr = w.getAccountFromPrivateKey(active_wif)
a = Account(usr, blockchain_instance=hv)
deleg = a.get_vesting_delegations()
for x in deleg:
    delegatee = x["delegatee"]
    print(f"[Dropping delegation to {delegatee} to 0]")
    pprint(a.delegate_vesting_shares(delegatee, 0))
