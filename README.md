lev
===

commandline and repl leveldb

# As a commandline tool
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

# As a REPL
```bash
$lev
>get('keyname')
```
