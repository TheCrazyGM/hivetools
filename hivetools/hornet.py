#!/bin/env python3
import time
from pprint import pprint

import click
from beem import Steem
from beem.account import Account
from beem.instance import set_shared_steem_instance, shared_steem_instance
from beem.wallet import Wallet


@click.command()
@click.option('--chain', '-c', default=["steem", "hive"], show_default=True,
              help='Hive or Steem or both')
@click.option('--mana', '-m', default=10000, show_default=True,
              help='How much Mana you want to save')
def claim_it(chain, mana):
    """Very simple Utility to claim HIVE and/or STEEM account tokens"""

    api = {"steem": "https://api.steemit.com", "hive": "https://api.hive.blog"}
    wif = click.prompt("Enter private key", confirmation_prompt=False, hide_input=True)
    for network in chain:
        steem = Steem(node=api[network], keys=wif)
        set_shared_steem_instance(steem)
        wallet = Wallet(shared_steem_instance())
        steemid = wallet.getAccountFromPrivateKey(wif)
        account = Account(steemid, steem_instance=shared_steem_instance())
        mana_old = account.get_rc_manabar()
        mana_human_readable = mana_old["current_mana"] / 1e9

        tries = 2
        for i in range(tries):
            try:
                if mana_human_readable > mana:
                    click.echo(f"[Mana on {network} Before: %f RC]" % (mana_old["current_mana"] / 1e9))
                    tx = steem.claim_account(creator=steemid, fee=None)
                    pprint(tx)
                    time.sleep(5)
                    mana_new = account.get_rc_manabar()
                    click.echo(f"[Mana on {network} After: %f RC]" % (mana_new["current_mana"] / 1e9))
                    rc_costs = mana_old["current_mana"] - mana_new["current_mana"]
                    click.echo("[Mana cost: %f RC]" % (rc_costs / 1e9))
                else:
                    click.echo(
                        f"[Skipping claim account: current mana of %f lower than the set limit of %f on {network}]" % (
                            mana_human_readable, mana))
                    time.sleep(5)
            except Exception as e:
                click.echo('[Error:', e, ' - Trying Again]')
                time.sleep(2)
                if i < tries:
                    continue
                else:
                    click.echo('[Failed to claim]')
            else:
                break


if __name__ == '__main__':
    claim_it()