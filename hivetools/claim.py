#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "beem",
#     "python-dotenv",
# ]
# ///

import os
from typing import Optional

from beem import Hive
from beem.account import Account
from beem.wallet import Wallet
from dotenv import load_dotenv


def claim_account(mana_threshold: float = 10000) -> Optional[dict]:
    """Claim HIVE account tokens if mana is sufficient."""
    load_dotenv()

    try:
        # Setup Hive connection
        wif = os.getenv("ACTIVE_WIF")
        if not wif:
            raise ValueError("No active WIF found in environment")

        hive = Hive(node="https://api.hive.blog", keys=wif)
        wallet = Wallet(blockchain_instance=hive)
        hiveid = wallet.getAccountFromPrivateKey(wif)
        account = Account(hiveid, blockchain_instance=hive)

        # Check mana
        mana_data = account.get_rc_manabar()
        mana_current = mana_data["current_mana"] / 1e9

        if mana_current < mana_threshold:
            print(f"Insufficient mana: {mana_current:.6f} (threshold: {mana_threshold:.6f})")
            return None

        # Log pre-claim mana
        print(f"Mana before claim: {mana_current:.6f} RC")

        # Attempt account claim
        tx = hive.claim_account(creator=hiveid, fee=None)

        # Log post-claim details
        mana_after = account.get_rc_manabar()
        mana_cost = (mana_data["current_mana"] - mana_after["current_mana"]) / 1e9
        print(f"Mana after claim: {mana_after['current_mana'] / 1e9:.6f} RC")
        print(f"Mana cost: {mana_cost:.6f} RC")

        return tx

    except Exception as e:
        print(f"Claim account error: {e}")
        return None


def main():
    mana_threshold = float(os.getenv("MANA", 10000))
    claim_account(mana_threshold)


if __name__ == "__main__":
    main()
