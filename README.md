# SYNOPSIS
Commandline [LevelDB][0] management.

# FEATURES
- Command line data management
- Interactive data management
- REPL features auto-complete and suggestions for keys.
- REPL automatically saves and reloads REPL history.
- Connect to a network enabled database via [multilevel][1].

# INSTALLATION
```bash
$npm install lev -g
```

# CLI EXAMPLES
Get the first 10 keys in the database, the path is optional.
```js
lev path/to/db --keys --limit 10
```

Get the first ten records starting at `bazz` and ending at `zomg`.
```js
lev path/to/db --read --limit 10 --start 'bazz' --end 'zomg'
```

# CLI OPTIONS
Options match the API. ie `lev /path/to/db --keys --start 'b' --end 'e' --limit 2`

For connecting to a [multilevel][1] enabled instance, specify the `port` parameter:

`lev --port 1337 --keys ...`

## REPL
The REPL has autocomplete and suggestion lists for database keys. Type 
`get('...<tab>`, `put('...<tab>`, etc.

```bash
>lev path/to/db

compression = true
encoding = utf8
keyEncoding = utf8
valueEncoding = utf8
levelup version = 0.6.0

path/to/db>read({ limit: 2 })
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

Level can also be run against a database over the network by using the `--port`
and `--host` options. For example

```bash
>lev --port 9099 --host localhost
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
   write()   A writable stream for key value objects.
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
You can create a `.lev` file in your home directory and it will be used to set 
the defaults. Command line arguments will override the default settings in this 
file.

```json
{
  "createIfMissing": true,
  "encoding": "json"
}

```

[0]:https://github.com/rvagg/node-levelup
[1]:https://github.com/juliangruber/multilevel
