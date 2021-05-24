#!/usr/bin/env python3
from getpass import getpass

from beemgraphenebase.account import PasswordKey
from tabulate import tabulate

hive_id = input("Hive User ID: ")
brain_key = getpass(prompt="Master Password: ")

roles = ["owner", "active", "posting", "memo"]
data = []
for role in roles:
    keys = PasswordKey(hive_id, brain_key, role=role, prefix="STM")
    priv_key = keys.get_private()
    pub_key = keys.get_public()
    data.append([role, str(pub_key), str(priv_key)])

print(tabulate(data, headers=["Role", "Public Key", "Private Key"]))
