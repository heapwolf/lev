lev
===

A commandline tool and repl (with autocomplete) for `leveldb`.

```bash
$npm install lev -g
```

# Usage
Use `--format` from the commandline or `format(true)` in the cli for nice(r) output.

## As a commandline tool
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
The REPL has autocomplete for keys. First run `keys()` to create a cache then
type `get('...<tab>`, `put('...<tab>`, etc. 

```bash
$lev
>get('keyname')
```

