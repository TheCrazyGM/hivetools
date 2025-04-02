#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "hive-nectar",
#     "rich",
# ]
#
# [tool.uv.sources]
# hive-nectar = { git = "https://github.com/thecrazygm/hive-nectar" }
# ///

from getpass import getpass
from datetime import datetime

from nectar import Hive
from nectar.account import Account
from nectargraphenebase.account import BrainKey, PasswordKey
from rich.box import DOUBLE
from rich.console import Console, Group
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

# Set to False when you're ready to actually update your keys
DRY_RUN = True


def generate_mnemonic():
    """Generate a BIP39 mnemonic passphrase."""
    brain_key = BrainKey()
    mnemonic = brain_key.get_brainkey()
    return mnemonic


def generate_keys(account_name, password):
    """Generate all key pairs for a Hive account given a password."""
    roles = ["owner", "active", "posting", "memo"]
    keys_data = []

    for role in roles:
        # Generate keys for this role
        key = PasswordKey(account_name, password, role=role)
        public_key = key.get_public_key()
        private_key = key.get_private_key()

        # Store the role and keys
        keys_data.append([role, str(public_key), str(private_key)])

    return keys_data


def update_account_keys(account_name, owner_wif, new_password):
    """Update all account keys using the new password."""
    console = Console()

    try:
        # Initialize Hive instance
        hive = Hive(
            keys=owner_wif,
            node="https://api.hive.blog",
            nobroadcast=DRY_RUN,
        )

        # Get the account
        account = Account(account_name, blockchain_instance=hive)

        # Update the account keys
        if DRY_RUN:
            console.print("DRY RUN: Would update account keys with:", style="yellow")
            console.print(f"Account: {account_name}")
            console.print(f"New password: {new_password}")
            status = "SIMULATED"
        else:
            account.update_account_keys(new_password, account_name)
            status = "UPDATED"

        return f"Account keys {status} successfully!"

    except Exception as e:
        return f"Error updating keys: {e}"


def display_keys(account_name, password, keys_data):
    """Display the generated keys in a formatted table."""
    console = Console()
    
    # Create header with account info
    header = Text(f"Account: {account_name}", style="bold cyan")
    
    # Create timestamp footer
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    footer = Text(f"Updated: {current_time}", style="dim italic")
    
    # Create the keys table with double borders - ensure full width for keys
    keys_table = Table(
        title="Account Keys",
        show_header=True,
        header_style="bold magenta",
        padding=(0, 1),
        expand=True,  # Allow table to expand to full width
        border_style="blue",
        box=DOUBLE,
        title_justify="center",
    )

    # Use fixed widths for columns to ensure keys are fully visible
    keys_table.add_column("Role", style="cyan", no_wrap=True, width=10)
    keys_table.add_column("Public Key", style="magenta", width=55, no_wrap=True)  # Ensure no wrapping
    keys_table.add_column("Private Key", style="green", width=55, no_wrap=True)  # Ensure no wrapping

    for row in keys_data:
        keys_table.add_row(row[0], row[1], row[2])
    
    # Create password info section
    password_text = f"Master Password: {password}"
    password_panel = Panel(
        password_text,
        border_style="yellow",
        padding=(0, 1),
        title="Keep Secure",
        title_align="center"
    )
    
    # Create a group with all elements
    group = Group(
        header,
        Panel(keys_table, border_style="blue", padding=(0, 0)),
        password_panel,
        footer,
    )
    
    # Get the console width
    console_width = console.width
    
    # Create the main panel - allow more width for keys
    status = "[bold red]DRY RUN MODE[/bold red]" if DRY_RUN else "[bold green]LIVE MODE[/bold green]"
    
    # Use a wider minimum width to ensure keys display fully
    min_width = 150  # Increased for full key display
    panel = Panel(
        group,
        title=f"[bold blue]Hive Account Key Update[/bold blue] - {status}",
        subtitle="[dim]Powered by Nectar & Rich[/dim]",
        title_align="center",
        subtitle_align="right",
        border_style="cyan",
        padding=(1, 1),
        expand=True,
        width=min(console_width - 2, min_width),  # Use larger min width
    )
    
    # Print the panel
    console.print(panel)
    
    # Additional notices
    if DRY_RUN:
        console.print(
            "\n[bold red]WARNING: This was a DRY RUN. Set DRY_RUN = False to actually update your keys.[/bold red]"
        )
    else:
        console.print(
            "\n[bold green]SUCCESS: Your account keys have been updated![/bold green]"
        )

    console.print(
        "\n[bold yellow]IMPORTANT: Save these keys in a secure location. You will need them to access your account.[/bold yellow]"
    )


def save_keys_to_file(account_name, password, keys_data):
    """Save the generated keys to a file in JSON format."""
    import json
    import os
    from pathlib import Path
    from datetime import datetime
    
    console = Console()
    current_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename_base = f"hive_keys_{account_name}_{current_time}"
    
    # Prepare the data
    keys_dict = {
        "account": account_name,
        "master_password": password,
        "generated_at": datetime.now().isoformat(),
        "keys": {}
    }
    
    for row in keys_data:
        role = row[0]
        keys_dict["keys"][role] = {
            "public": row[1],
            "private": row[2]
        }
    
    # Add a warning message
    warning = "IMPORTANT: This file contains your private keys. Store it securely and never share it with anyone."
    
    # Ask for save location
    home_dir = str(Path.home())
    suggested_dir = os.path.join(home_dir, "Documents")
    save_dir = input(f"Enter directory to save the file [default: {suggested_dir}]: ").strip() or suggested_dir
    
    # Ensure the directory exists
    os.makedirs(save_dir, exist_ok=True)
    
    try:
        # Save in JSON format
        filename = os.path.join(save_dir, f"{filename_base}.json")
        with open(filename, "w") as f:
            f.write(f"// {warning}\n")
            json.dump(keys_dict, f, indent=2)
        
        console.print(f"\n[bold green]Keys successfully saved to:[/bold green] {filename}")
        return True
    
    except Exception as e:
        console.print(f"\n[bold red]Error saving keys:[/bold red] {e}")
        return False


def main():
    console = Console()
    console.print("[bold]Hive Account Key Update Tool[/bold]")
    console.print(
        "Use this tool to update all keys for your Hive account if you suspect it may be compromised."
    )

    if DRY_RUN:
        console.print(
            "\n[bold yellow]NOTICE: Currently in DRY RUN mode. No actual changes will be made.[/bold yellow]"
        )
        console.print(
            "Set DRY_RUN = False at the top of the script when you're ready to update your keys.\n"
        )

    # Get account information
    account_name = input("Enter your Hive account name: ")
    owner_key = getpass("Enter your current owner private key: ")

    # Generate and suggest a mnemonic password
    suggested_password = generate_mnemonic()
    console.print("\nSuggested password (BIP39 mnemonic):", style="bold cyan")
    console.print(suggested_password, style="yellow")
    console.print("")

    # Let the user choose the password
    password = input("Enter new master password (or press Enter to use suggested): ")
    if not password:
        password = suggested_password
        console.print("Using suggested password.", style="green")

    # Update the account keys
    console.print("\nUpdating account keys...", style="bold")
    result = update_account_keys(account_name, owner_key, password)
    console.print(result, style="bold blue")

    # Generate and display the new keys
    keys_data = generate_keys(account_name, password)
    display_keys(account_name, password, keys_data)
    
    # Ask if the user wants to save a copy of the keys
    save_choice = input("\nWould you like to save a copy of your keys to a file? (y/n): ").lower().strip()
    if save_choice and save_choice[0] == "y":
        save_keys_to_file(account_name, password, keys_data)
    else:
        console.print("\n[yellow]Keys not saved to file. Make sure to record them securely![/yellow]")


if __name__ == "__main__":
    main()
