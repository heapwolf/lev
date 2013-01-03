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

## As a REPL
The REPL has autocomplete and suggestions for database keys. First run 
`keys()` to create a cache then type `get('...<tab>`, `put('...<tab>`, 
etc. 

```bash
$lev
>get('keyname')
```

# About LevelDB
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

