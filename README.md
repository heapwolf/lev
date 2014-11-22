# SYNOPSIS
A simple and convenient commandline tool and REPL for [`leveldb`](http://leveldb.org/).

# FEATURES
- REPL with colorized auto-complete and key suggestions
- REPL automatically saves and reloads REPL history

# SCREENSHOT
![screenshot](/docs/screenshot.png)

# REPL COMMANDS

## GET &lt;key&gt;
Get a key from the database.

## PUT &lt;key&gt; &lt;value&gt;
Put a value into the database. If you have `keyEncoding` or `valueEncoding`
set to `json`, these values will be parsed from strings into `json`.

## DEL &lt;key&gt;
Delete a key from the database.

## START &lt;key-pattern&gt;
Defines the start of the current range. You can also use `GT` or `GTE`.

## END &lt;key-pattern&gt;
Defines the end of the current range. You can also use `LT` or `LTE`.

## LIMIT &lt;number&gt;
Limit the number of records in the current range (defaults to 5000).

## REVERSE
Reverse the records in the current range.

# CLI COMMANDS
These all match the parameters used with [`levelup`](https://github.com/rvagg/node-levelup).

