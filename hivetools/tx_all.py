#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "beem",
#     "hiveengine",
#     "python-dotenv",
# ]
# ///

import os
import time

from beem import hive
from beem.wallet import Wallet
from dotenv import load_dotenv
from hiveengine.tokens import Tokens
from hiveengine.wallet import Wallet as heWallet


def dump_all():
    load_dotenv()
    """Go down the list of hive Engine tokens and transfer full balance to destination"""
    ACTIVE_WIF = os.getenv("ACTIVE_WIF")
    send_to = input("Enter destination: ")

    hv = hive(keys=[ACTIVE_WIF], nodes="https://api.hive.blog")
    w = Wallet(blockchain_instance=hv)
    t = Tokens()
    usr = w.getAccountFromPrivateKey(ACTIVE_WIF)
    hew = heWallet(account=usr, blockchain_instance=hv)
    tokens = hew.get_balances()
    for token in tokens:
        symbol = token["symbol"]
        info = t.get_token(symbol)
        p = info["precision"]
        b = float(token["balance"])
        balance = float(f"{b:.{p}f}")
        if balance > 0:
            print(f"[ Transfering {balance} of {symbol} to {send_to} ]")
            hew.transfer(send_to, balance, symbol, memo="Automatic transfer")
            time.sleep(1)
    return None


if __name__ == "__main__":
    dump_all()
