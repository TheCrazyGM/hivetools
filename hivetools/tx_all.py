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

from beem import Hive
from beem.wallet import Wallet
from dotenv import load_dotenv
from hiveengine.tokens import Tokens
from hiveengine.wallet import Wallet as heWallet


def dump_all():
    load_dotenv()
    ACTIVE_WIF = os.getenv("ACTIVE_WIF")
    send_to = input("Enter destination: ")

    hv = Hive(keys=[ACTIVE_WIF], nodes="https://api.hive.blog")
    w = Wallet(blockchain_instance=hv)
    usr = w.getAccountFromPrivateKey(ACTIVE_WIF)
    hew = heWallet(account=usr, blockchain_instance=hv)
    tokens = hew.get_balances()

    for token in tokens:
        symbol = token["symbol"]
        info = Tokens().get_token(symbol)
        balance = float(f"{float(token['balance']):.{info['precision']}f}")
        if balance > 0:
            print(f"[ Transfering {balance} of {symbol} to {send_to} ]")
            hew.transfer(send_to, balance, symbol, memo="Automatic transfer")
            time.sleep(1)

    return None


if __name__ == "__main__":
    dump_all()
