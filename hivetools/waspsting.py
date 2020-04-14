#!/usr/bin/env python3
# Brian version. 
import time
from pprint import pprint

from beem import Steem
from beem.wallet import Wallet
from steemengine.tokens import Tokens
from steemengine.wallet import Wallet as seWallet


def wasp():
    """ Go down the list of Steem Engine tokens and transfer full balance to destination"""
    send_to = input('Enter destination: ')
    active_wif = input('Enter your Active Key: ')
    steem = Steem(keys=[active_wif], nodes='https://api.steemit.com')
    w = Wallet(steem_instance=steem)
    t = Tokens()    
    usr = w.getAccountFromPrivateKey(active_wif)
    sew = seWallet(account=usr, steem_instance=steem)
    tokens = sew.get_balances()
    for token in tokens:
        symbol = token['symbol']
        info = t.get_token(symbol)
        p = info['precision']
        b = float(token['balance'])
        balance = float(f'{b:.{p}f}')
        if balance > 0:
            print(f'[ Transfering {balance} of {symbol} to {send_to} ]')
            #pprint(sew.transfer(send_to, balance, symbol, memo="waspsting.py transfer")
            sew.transfer(send_to, balance, symbol, memo="waspsting.py transfer")
            time.sleep(1)
    return None


if __name__ == "__main__":
    wasp()