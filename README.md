
# Synopsis
A commandline tool and repl (with autocomplete) for `leveldb`.

# Installation
```bash
$npm install lev -g
```

# Usage
All commands accept the same options as the levelup methods. They also parse
the parameters to for your convenience, for instance specifying `keys(4)` or
`lev -k 4` to get the first four keys. These convenience methods are detailed 
below.

## As a commandline tool

An example of getting all the keys in the database and printing them to stdout.
```js
lev -k 10
```

```
-r --readStream       A readable stream of the full database.
-g --get              Fetch data from the store.
-p --put              Insert data into the store.
-d --del              Remove data from the store.
-k --keys             A readable stream of all keys in the database
-a --approximateSize  Get the approximate number of bytes of file system space used by the given range
-v --values           A readable stream of all values in the database
-f --format           Make nice(r) output to standard out.
-h --help             This help
```

### readStream
Opens a readable stream. accepts `--start`, `--end`, `--limit` and `--reverse`.

### get

### put

### del

### keys

### values

### format
Use `--format` from the commandline or `format(1)` in the cli for nice(r) output.

### help


## As a REPL
The REPL has autocomplete and suggestions for database keys. First run 
`keys()` to create a cache then type `get('...<tab>`, `put('...<tab>`, 
etc. 

```bash
$lev
>get('keyname')
```

# Commands

