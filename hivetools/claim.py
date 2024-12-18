#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "beem",
#     "python-dotenv",
# ]
# ///

import os
import time
from pprint import pprint

from beem import Hive
from beem.account import Account
from beem.wallet import Wallet
from dotenv import load_dotenv


def claim_it(mana):
    load_dotenv()
    """Very simple Utility to claim HIVE account tokens"""
    api = "https://api.hive.blog"
    wif = os.getenv("ACTIVE_WIF")
    hive = Hive(node=api, keys=wif)
    wallet = Wallet(blockchain_instance=hive)
    hiveid = wallet.getAccountFromPrivateKey(wif)
    account = Account(hiveid, blockchain_instance=hive)
    mana_old = account.get_rc_manabar()
    mana_human_readable = mana_old["current_mana"] / 1e9
    tries = 2
    for i in range(tries):
        try:
            if mana_human_readable > mana:
                print(f"[Mana on hive Before: {mana_old['current_mana'] / 1e9:.6f} RC]")
                tx = hive.claim_account(creator=hiveid, fee=None)
                pprint(tx)
                time.sleep(5)
                mana_new = account.get_rc_manabar()
                print(f"[Mana on hive After: {mana_new['current_mana'] / 1e9:.6f} RC]")
                rc_costs = mana_old["current_mana"] - mana_new["current_mana"]
                print(f"[Mana cost: {rc_costs / 1e9:.6f} RC]")
            else:
                print(
                    f"[Skipping claim account: current mana of {mana_human_readable:.6f} lower than the set limit of {mana:.6f} hive]"
                )
                time.sleep(5)
        except Exception as e:
            print(f"[Error: {e} - Trying Again]")
            time.sleep(2)
            if i < tries - 1:
                continue
            else:
                print("[Failed to claim]")
        else:
            break


if __name__ == "__main__":
    mana = int(os.getenv("MANA", 10000))
    claim_it(mana)
