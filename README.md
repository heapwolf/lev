# SYNOPSIS
A commandline tool and repl (with autocomplete and suggestions for keys) for `leveldb`.

# INSTALLATION
```bash
$npm install lev -g
```

# USAGE

## CLI
An example of getting the first 10 keys in the database and printing them out.
```js
lev path/to/db -k 10
```

```
-r --read    Read a range of keys and values from the database.
-k --keys    Read a range of keys from the database.
-v --values  Read a range of values from the database.
-g --get     Fetch data from the store.
-p --put     Insert data into the store.
-d --del     Remove data from the store.
   --delr    Delete a range from the database.
-a --size    An approximate number of bytes of used by the given range.
-h --help    This help
```

## REPL
The REPL has autocomplete and suggestions for database keys. Type 
`get('...<tab>`, `put('...<tab>`, etc. Because some databases can be extremely
large, you must specify a value when doing operations that stream data. If you
are absolutely sure you want everything you can specify `-1` as a value.

```bash
>lev test/fixtures/db/
>read(2)
>
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
>
```

```
>help()

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
>
```

# Default Configuration
You can create a `.lev` file in your home directory and it will be used to set the 
defaults. Command line arguments will override the default settings in this file.

```json
{
  "level": {
    "createIfMissing": true,
    "encoding": "json"
  }
}

```
