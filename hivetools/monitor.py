#!/usr/bin/env python3

import dataset
from beem import Steem
from beem.blockchain import Blockchain

watch = "brianoflondon"

hive = Steem(node='https://anyx.io')
db = dataset.connect('sqlite:///mydatabase.db')

# System Variables
blockchain = Blockchain(steem_instance=hive)
stream = blockchain.stream(opNames=['transfer'], raw_ops=False, threading=True, thread_num=4)
table = db[watch]


# parse json data to SQL insert
def update_db(post):
    try:
        table.insert(dict(post))
        db.commit()
    except Exception as e:
        print(f'[Error: {e} moving on]')
        db.rollback()


def monitor():
    print("[Starting up...]")
    db.begin()
    # Read the live stream and filter out only transfers
    for post in stream:
        if post["to"] == watch or post["from"] == watch:
            print(f"[Transaction Found from {post['from']} to {post['to']}]")
            update_db(post)


if __name__ == "__main__":
    monitor()