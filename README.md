# HiveTools

A collection of command-line tools for managing Hive blockchain accounts and content.

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
3. Copy `.env.example` to `.env` and add your keys

## Available Tools

### Account Management
- `claim.py` - Check claimable accounts and claim new accounts
- `kill_auth.py` - Remove account authorities
- `power_down.py` - Initiate power down of all HIVE POWER
- `view_keys.py` - Display account keys and authorities

### Content Management
- `lookup_edits.py` - View edit history of posts
- `tx_dust.py` - Clean up small balances

### Site Tools
- `sitetools/` - Tools for managing Hive-powered websites:
  - Delegation
  - Account Authority

## Configuration

Create a `.env` file with your account keys:
```env
POSTING_WIF=5xxxxx
ACTIVE_WIF=5xxxxx
```

## Usage

All tools can be run directly from the command line:
```bash
python hivetools/tool_name.py
```

Each tool will prompt for any required input and display relevant information.

## Security

- Never share your private keys
- Store your `.env` file securely
- Use appropriate key permissions (posting/active) for each operation

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
