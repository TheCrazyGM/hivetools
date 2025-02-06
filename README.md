# HiveTools - Hive Blockchain Utilities

A collection of Python utilities for interacting with the Hive blockchain.

## Features

- **Account Management**: Claim accounts, manage delegations, and power down
- **Token Operations**: Transfer tokens and monitor transactions
- **Automation**: Bot for automated comment upvoting
- **Security**: View and manage account keys

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TheCrazyGM/hivetools.git
   cd hivetools
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Configure environment variables in `.env` file:
   ```bash
   cp .env.example .env
   ```

## Tools Overview

### claim.py
Claims an account if your Mana is within reason using Hive.

**Usage**:
```bash
python3 claim.py
```

### dedelegate.py
Drops all delegation on Hive.

**Usage**:
```bash
python3 dedelegate.py
```

### power_down.py
Starts the power down of all currently available vests on Hive.

**Usage**:
```bash
python3 power_down.py
```

### transfer_monitor.py
Monitors transfers and creates a SQLite3 database.

**Usage**:
```bash
python3 transfer_monitor.py
```

### tx_all.py
Transfers all hive-engine tokens to a destination account.

**Usage**:
```bash
python3 tx_all.py
```

### upvote_bot.py
A comment bot that upvotes parent comments based on criteria.

**Usage**:
```bash
python upvote_bot.py
```

### view_keys.py
Displays keys associated with Hive accounts.

**Usage**:
```bash
python3 view_keys.py
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
