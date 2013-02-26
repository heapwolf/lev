# Synopsis
A commandline tool and repl (with autocomplete and suggestions for keys) for `leveldb`.

# Installation
```bash
$npm install lev -g
```

# Usage
You can use `keys(4)` from the REPL or `lev -k 4` from the CLI to get the first 
four keys in the database. The parameters accepted on the commandline should be 
the same as in the javascript methods.

## As a commandline tool

An example of getting the first 10 keys in the database and printing them out.
```js
lev -k 10
```

```
-r --readStream       A readable stream of the full database.
-g --get              Fetch data from the store.
-p --put              Insert data into the store.
-d --del              Remove data from the store.
-k --keys             A readable stream of all keys in the database
-a --approximateSize  An approximate number of bytes of used by the given range
-v --values           A readable stream of all values in the database
-f --format           Make nice(r) output to standard out.
-h --help             This help
```

## As a REPL
The REPL has autocomplete and suggestions for database keys. First run `keys()` 
to create a cache then type `get('...<tab>`, `put('...<tab>`, 
etc. It is important to note that most commands are executed async, so it wont 
be uncommon to see `undefined` printed out as a return value.

```bash
$lev /path/to/database
>get('keyname')
'{ k: 1 }'
>
```

```
>help()

   pwd()              Path of the current working database.
   create()           Return a new instance of leveldb
   use()              Select the current database to use
   ls()               list of databases
   readStream()       A readable stream of the full database.
   get()              Fetch data from the store.
   put()              Insert data into the store.
   del()              Remove data from the store.
   keys()             A readable stream of all keys in the database
   approximateSize()  An approximate number of bytes of used by the given range
   values()           A readable stream of all values in the database
   format()           Make nice(r) output to standard out.
   help()             This help
'OK'
>ls()
[ 'test/fixtures/db/',
  'test/fixtures/foobar' ]
```

### use([location])
Specify the leveldb instance to use (provides tab completion just like require).

### ls()
Get a list of instances (use the `use()` command to add more from the file system).

### keys([start], [end], [limit])
Get the keys from the current database.


# Default Configuration
You can create a `.lev` file in your home directory and it will be used to set the 
defaults. Command line arguments will override the default settings in this file.

```json
{
  "format": true,
  "level": {
    "createIfMissing": true,
    "encoding": "json"
  }
}

```

### format 
Expects a `boolean` value indicating if formatting should be used or not.

### level
Settings that are passed to the leveldb constructor (see [these][0] docs).

# About LevelDB
To lean more about leveldb's files and their formats go [here][2].

LevelDB is a fast key-value storage engine that provides an ordered mapping 
from string keys to string values. It manages compression and caching of hot
data.

LevelDB is a very small, highly portable C++ library without any user facing 
features. It was designed as a building block for higher-level storage systems.

## Who uses it 
LevelDB is the foundation for data storage in Google's Web Browser Chrome. 
Google's Bigtable manages millions of tablets where the contents of a particular 
tablet are represented by a precursor to LevelDB. The Riak distributed database 
has added support for using LevelDB for its per-node storage.

## Why do they use it
LevelDB runs on many Unix based systems, Mac OS X, Windows, and Android. It has 
[good][1] performance across a wide variety of workloads.

LevelDB is optimized for batch updates that modify many keys scattered across a 
large key space allowing an inverted index that does not fit in memory to be 
updated efficiently.

[0]:https://github.com/rvagg/node-levelup
[1]:http://leveldb.googlecode.com/svn/trunk/doc/benchmark.html
[2]:http://leveldb.googlecode.com/svn/trunk/doc/impl.html
