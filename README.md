# STATUS

[![development sponsored by voltra.co](https://img.shields.io/badge/Development%20sponsored%20by-Voltra.co-yellow.svg)](https://voltra.co/)

# SYNOPSIS
A simple and convenient commandline tool and REPL for [`leveldb`](http://leveldb.org/).

# FEATURES
- REPL with colorized tab-completion and zsh/fish style key suggestions
- REPL automatically saves and reloads REPL history

# SCREENSHOT
![screenshot](/docs/screenshot.png)

# INSTALLATION

```
$ npm install -g lev
```

# BASIC USAGE

```
$ lev path/to/db
```

# REPL COMMANDS
Use upper or lower case for the following commands.

## GET &lt;key&gt;
Get a key from the database.

## PUT &lt;key&gt; &lt;value&gt;
Put a value into the database. If you have `keyEncoding` or `valueEncoding`
set to `json`, these values will be parsed from strings into `json`.

## DEL &lt;key&gt;
Delete a key from the database.

## LS
Get all the keys in the current range.

## START &lt;key-pattern&gt;
Defines the start of the current range. You can also use `GT` or `GTE`.

## END &lt;key-pattern&gt;
Defines the end of the current range. You can also use `LT` or `LTE`.

## LIMIT &lt;number&gt;
Limit the number of records in the current range (defaults to 5000).

## REVERSE
Reverse the records in the current range.

# CLI COMMANDS
These all match the parameters used with
[`levelup`](https://github.com/rvagg/node-levelup). The default encoding
for the database is set to `json`.

## --get &lt;key&gt;
Get a value
```sh
lev --get foo
```

## --put &lt;key&gt;
Put a value
```sh
lev --put foo --value bar
```

## --del &lt;key&gt;
Delete a value
```sh
lev --del foo
```

## --batch &lt;operations&gt;
Put or delete several values, using [`levelup` batch syntax](https://github.com/Level/levelup#dbbatcharray-options-callback-array-form)
```sh
lev --batch '[
{"type":"del","key":"father"},
{"type":"put","key":"name","value":"Yuri Irsenovich Kim"},
{"type":"put","key":"dob","value":"16 February 1941"},
{"type":"put","key":"spouse","value":"Kim Young-sook"},
{"type":"put","key":"occupation","value":"Clown"}
]'
```
or from a file
```sh
# there should be one entry per line
# either as valid JSON
echo '[
{"type":"del","key":"father"},
{"type":"put","key":"name","value":"Yuri Irsenovich Kim"},
{"type":"put","key":"dob","value":"16 February 1941"},
{"type":"put","key":"spouse","value":"Kim Young-sook"},
{"type":"put","key":"occupation","value":"Clown"}
]' > ops.json
# or as newline-delimited JSON
echo '
{"type":"del","key":"father"}
{"type":"put","key":"name","value":"Yuri Irsenovich Kim"}
{"type":"put","key":"dob","value":"16 February 1941"}
{"type":"put","key":"spouse","value":"Kim Young-sook"}
{"type":"put","key":"occupation","value":"Clown"}
' > ops.json
lev --batch ./ops.json
```

### Import / Export
If the type is omitted, defaults to `put`, which allows to use the command to do imports/exports, in combination with [`--all`](#--all):
```sh
lev --all > leveldb.export
lev /tmp/my-new-db --batch leveldb.export
```
If it's a large export, you can compress it on the fly
```sh
lev --all | gzip -9 > leveldb.export.gz
gzip -dk leveldb.export.gz
lev /tmp/my-new-db --batch leveldb.export
```

### Delete by range
The `--batch` option can also be used to delete key/values by range in 2 steps:
```
# 1 - collect all the key/values to delete
lev --all --start 'foo' --end 'fooz' > ./to_delete
# 2 - pass the file as argument to the --batch option with a --del flag
lev --batch ./to_delete --del
```

## --keys
List all the keys in the current range. Will tabularize the output by default (see `--line`).
```sh
lev --keys
```

## --values
List all the values in the current range.
Emit as a new-line delimited stream of json.
```sh
lev --values
```

## --all
List all the keys and values in the current range.
Emit as a new-line delimited stream of json.
```sh
lev --all
```
It can be used to create an export of the database, to be imported with [`--batch`](#--batch)
```sh
lev --all > leveldb.export
lev /tmp/my-new-db --batch leveldb.export
```

## --start &lt;key-pattern&gt;
Specify the start of the current range. You can also use `gt` or `gte`.
```sh
# output all keys after 'foo'
lev --keys --start 'foo'
# which is equivalent to
lev --keys --gte 'foo'
# the same for values
lev --values --start 'foo'
```

## --end &lt;key-pattern&gt;
Specify the end of the current range. You can also use `lt` and `lte`.
```sh
# output all keys before 'fooz'
lev --keys --end 'fooz'
# which is equivalent to
lev --keys --lte 'fooz'
# the same for values
lev --values --end 'fooz'
# output all keys between 'foo' and 'fooz'
lev --keys --start 'foo' --end 'fooz'
```

## --match &lt;key-pattern&gt;
Filter keys or values by a pattern applied on the key
```sh
lev  --keys --match 'f*'
lev  --values --match 'f*'
lev  --all --match 'f*'
# Equivalent to
lev --match 'f*'
```

See [`minimatch` doc](https://github.com/isaacs/minimatch#readme) for patterns

## --limit &lt;number&gt;
Limit the number of records emitted in the current range.
```sh
lev --keys --limit 10
lev --values --start 'foo' --end 'fooz' --limit 100
lev --match 'f*' --limit 10
```

## --reverse
Reverse the stream.
```sh
lev --keys --reverse
lev --keys --start 'foo' --end 'fooz' --limit 100 --reverse
```

## --line
Output one key per line (instead of the default tabularized output)
```sh
lev --keys --line
```

## --length
Output the length of the current range
```sh
# Count all the key/value pairs in the database
lev --length
# Counts the keys and values between 'foo' and 'fooz'
lev --start 'foo' --end 'fooz' --length
```

## --valueEncoding &lt;string&gt;
Specify the encoding for the values (Defaults to 'json').
```sh
lev --values --valueEncoding buffer
```

## --location &lt;string&gt;
Specify the path to the LevelDB to use. Defaults to the current directory.
```sh
lev --location /tmp/test-db --keys
# Equivalent to
lev /tmp/test-db --keys
```
