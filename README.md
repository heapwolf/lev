
# Synopsis
A commandline tool and repl (with autocomplete and suggestions for keys) for `leveldb`.

# Installation
```bash
$npm install lev -g
```

# Usage
All commands are nearly synonymous with the methods in the [levelup][0] libaray.
The exception is that they will parse parameters to for your convenience. For instance, 
you can specify `keys(4)` or `lev -k 4` to get the first four keys in the database. 
The parameters accepted on the commandline should be the same as in the javascript 
methods.

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
Opens a readable stream. 

```bash
lev -r 'a' 'a~' 4
```

```bash
lev -r 'a'
lev -r 3
```


`--start`

`--end`

`--limit`

`--reverse`.

### get
Fetch data from the store. Accepts `--key`, `--end`.

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

[0]:https://github.com/rvagg/node-levelup
