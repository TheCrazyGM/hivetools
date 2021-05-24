#!/usr/bin/env python3
from datetime import datetime, timedelta
from getpass import getpass
from pprint import pprint

from beem import Steem
from beem.account import Account
from beem.wallet import Wallet


def kill_the_power():
    # Get all availble VESTS to powerdown right now and make it into a string that the withdraw can handle
    avail_vests = a.get_effective_vesting_shares()
    vests_str = f"{avail_vests/ 1e6} VESTS"
    print(f"[Powering Down {vests_str}]")
    pprint(a.withdraw_vesting(vests_str))


def kill_em_all():
    # Get all delegate and set them to 0
    deleg = a.get_vesting_delegations()
    for x in deleg:
        delegatee = x["delegatee"]
        print(f"[Dropping delegation to {delegatee} to 0]")
        pprint(a.delegate_vesting_shares(delegatee, 0))
    # See how long before they can be powered down, including the ones just done and all others
    expiring = a.get_expiring_vesting_delegations()
    for x in expiring:
        now = datetime.now()
        then = datetime.strptime(x["expiration"], "%Y-%m-%dT%H:%M:%S")
        when = then - now
        if then > now:
            # TODO: no idea how to get the previous delgatee
            print(f"[{when} until delegation free for power down on ID:{x['id']}]")


if __name__ == "__main__":
    # Ask the User for the Active Key to start the whole process
    active_wif = getpass(prompt="Active key: ")

    # Set all sytem variables (steem connection, wallet, username, and account)
    stm = Steem(node="https://api.steemit.com", keys=[active_wif], nobroadcast=True)
    w = Wallet(steem_instance=stm)
    usr = w.getAccountFromPrivateKey(active_wif)
    a = Account(usr, steem_instance=stm)

    # Queue Metal Music Here
    kill_em_all()
    power_q = (
        input("Would you like Power Down current available VESTS: y/n ")
        .lower()
        .strip()[0]
    )
    if power_q is "y":
        kill_the_power()
