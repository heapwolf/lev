# SYNOPSIS
Commandline [LevelDB][0] management.

# FEATURES
- Command line data management
- Interactive data management
- REPL features auto-complete and suggestions for keys.
- REPL automatically saves and reloads REPL history.
- A TUI
- Connect to a network enabled database via [multilevel][1].

# INSTALLATION
```bash
$npm install lev -g
```

# TUI EXAMPLES
This is the default mode when you type `lev` at the commandline.

![img](/doc/1.png)

![img](/doc/2.png)

![img](/doc/3.png)


# CLI EXAMPLES
The `CLI` mode is useful for bash scripting. Here's an example 
where we get the first 10 keys in the database, the path is optional 
but if ommited a database will be created in the current working 
directory.

```bash
$ lev path/to/db --keys --limit 10
```

or short hand 

```bash
$ lev path/to/db -kl 10
```

Get the first ten records starting at `bazz` and ending at `zomg`.
```bash
$ lev path/to/db --limit 10 --start 'bazz' --end 'zomg'
```

Get the key `welcome` from inside the 2 sublevels deep
```bash
lev ./db --cd greetings/en --get 'welcome'
```

For connecting to a [multilevel][1] enabled instance, specify the 
`port` parameter:

`lev --port 1337 --keys ...`

## REPL
Start the REPL by providing only a path or host and port
```bash
$lev path/to/db
```

Commands in the REPL also match the API. But wait! There are a 
subset of commands that make common operations faster, easier and 
more fun. The following `keys` and `sublevels` are arbitrary and for 
the purpose of this example only.

#### `ls` A listing of keys in the current sublevel
Supports tab completion, same as the javascript function.
```
>ls
81!6dfb2cf92a411302b97a24cb977c1bd981711c
81!8613357d10da3ae2d295a53137b750d6b324b5
c9!25e7700452f8f269898cee9c18925350a6ef24
8c!699404e9c54349c32f4ca88a9ceea9382cffe9
>
```

#### `get` Get the value of a key and inspect it if possible 
Supports tab completion, same as the javascript function.

```
>get 81!6dfb2cf92a411302b97a24cb977c1bd981711c
'{ "greeting": "hello, world!" }'
>
```

#### `cd` create or change into a sublevel
Supports `cd ..` to navigate down a level. `cd /` to navigate to the 
root of the database. And `cd foo/bar/bazz` to navigate up to a deeply 
nested sublevel in the database.

```
>cd 97a24cb977c1bd9
/97a24cb977c1bd9>ls
c9!b5db29d11c6556b7d5b7ffe272dcefec9edae6
```

## Default Configuration
You can create a `.lev` file in your home directory and it will be used 
to set  the defaults. Command line arguments will override the default 
settings in this file.

```json
{
  "createIfMissing": true,
  "encoding": "json"
}

```

[0]:https://github.com/rvagg/node-levelup
[1]:https://github.com/juliangruber/multilevel

## License
MIT
