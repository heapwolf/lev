# SYNOPSIS
A simple commandline tool and REPL for leveldb.

# FEATURES
- REPL with colorized auto-complete and key suggestions
- REPL automatically saves and reloads REPL history

# SCREENSHOT
![screenshot](/docs/screenshot.png)

# REPL COMMANDS

## START <key-pattern>
Defines the start of the current range. You can also use `GT` or `GTE`.

## END <key-pattern>
Defines the end of the current range. You can also use `LT` or `LTE`.

## LIMIT <number>
Limit the number of records in the current range (defaults to 5000).

## REVERSE
Reverse the records in the current range.

# CLI COMMANDS
These all match the parameters used with [`levelup`](https://github.com/rvagg/node-levelup).

