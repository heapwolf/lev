# SYNOPSIS
A commandline tool and repl (with autocomplete and suggestions for keys) for `leveldb`.

# INSTALLATION
```bash
$npm install lev -g
```

# CLI EXAMPLES
Get the first 10 keys in the database, the path is optional.
```js
lev path/to/db -k 10
```

Get the first ten records starting at `bazz` and ending at `zomg`.
```js
lev -r 10 'bazz' 'zomg'
```

# CLI OPTIONS

### `-r, --read [limit] [start] [end]`
Stream a range of keys and values. Where limit is a number, start and end are 
strings.

### `--rev`
Return the values in reverse.

### `-k [limit] [start] [end], --keys [limit] [start] [end]`
Stream a range of keys.

### `-v [limit] [start] [end], --values [limit] [start] [end]`
Stream a range of values.

### `-g <key>, --get <key>`
Fetch the data for a specific key.

### `-p <key>, --put <key>`
Insert data for a specific key.

### `-d <key>, --del <key>`
Delete the data for a particular key.

### `--D <key> [key], --delr <key> [key]`
Delete a range starting from the first key until the second key if one is
provided.

### `-a, --size <key> [key]`
An approximate number of bytes of used by the given range.

### `--valueEncoding`
Specify encoding type for just the values.

### `--keyEncoding`
Specify encoding type for just the keys.

### `--encoding`
Specify encoding for both.

## REPL
The REPL has autocomplete and suggestion lists for database keys. Type 
`get('...<tab>`, `put('...<tab>`, etc. Because some databases can be extremely
large, you must specify a value when doing operations that stream data. If you
are absolutely sure you want everything you can specify `-1` as a value.

```bash
>lev path/to/db

compression = true
encoding = utf8
keyEncoding = utf8
valueEncoding = utf8
levelup version = 0.6.0

path/to/db>read(2)
path/to/db>
[
  {
    "key": "foo",
    "value": "bar"
  },
  {
    "key": "fuzz",
    "value": "bazz"
  }
]
path/to/db>
```

# REPL COMMANDS
```
path/to/db>help()

   config()  Get the current configuration object
   pwd()     Path of the current working database
   create()  Return a new instance of leveldb
   close()   Close an instance of leveldb
   open()    Open an instance of leveldb
   use()     Select the current database to use
   ls()      list of databases
   read()    Read a range of keys and values from the database.
   keys()    Read a range of keys from the database.
   values()  Read a range of values from the database.
   get()     Fetch data from the store.
   put()     Insert data into the store.
   del()     Remove data from the store.
   delr()    Delete a range from the database.
   size()    An approximate number of bytes of used by the given range.
   help()    This help

path/to/db>
```

## Default Configuration
You can create a `.lev` file in your home directory and it will be used to set the 
defaults. Command line arguments will override the default settings in this file.

```json
{
  "createIfMissing": true,
  "encoding": "json"
}

```
