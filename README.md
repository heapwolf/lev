
# Synopsis
A commandline tool and repl (with autocomplete) for `leveldb`.

# Installation
```bash
$npm install lev -g
```

# Usage
Use `--format` from the commandline or `format(true)` in the cli for nice(r) output.

## As a commandline tool

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

Do a range query to stdout (with a limit of 10)
```js
lev -r 'foo' 'foobar' -l 10
```

Do a verbose put

```js
lev --put 'keyname' '{a:10}'
```

Print all the keys to stdout (with a limit of 3)

```js
lev -k 3
```

## As a REPL
The REPL has autocomplete and suggestions for database keys. First run 
`keys()` to create a cache then type `get('...<tab>`, `put('...<tab>`, 
etc. 

```bash
$lev
>get('keyname')
```

```
>help()

   pwd()              Locaiton of the current database
   readStream()       A readable stream of the full database.
   get()              Fetch data from the store.
   put()              Insert data into the store.
   del()              Remove data from the store.
   keys()             A readable stream of all keys in the database
   approximateSize()  Approximate number of bytes of file system space used by the given range
   values()           A readable stream of all values in the database
   format()           Make nice(r) output to standard out.
   help()             This help
```

# Commands

