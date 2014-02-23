# SYNOPSIS
Complete [LevelDB][0] management for your terminal.

# FEATURES
- A Terminal User Interface
- REPL with colorized auto-complete and key suggestions
- REPL automatically saves and reloads REPL history
- Scriptable from the command line
- Connect to local or network enabled instances

# INSTALLATION
```bash
$npm install lev -g
```

# TUI EXAMPLES
This is the default mode when you type `lev` at the commandline.
I recommend a modern terminal program like [iTerm2][2] on OSX or
[urxvt] on Linux.

![img](/doc/1.png)

The UI has a built in `REPL`, like a browser. In additon to being
the Node.js repl, It has some special commands. Just like `VIM`, 
use `:` to invoke input.

`start [string]`, `end [string]`, `limit [number]`, `ls` (to list 
the keys in the current level). And a few others detailed below.

![img](/doc/2.png)

![img](/doc/3.png)


# CLI EXAMPLES
The `CLI` mode is useful for bash scripting. Here's an example 
where we get the first 10 keys in the database.

```bash
$ lev path/to/db --keys --limit 10
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
`port` and `manifest` parameters...

`lev --manifest path/to/manifest.json --port 1337 --keys ...`

## REPL

Start the interactive mod by providing a path and the `-i` option.
```bash
$lev path/to/db -i
```

#### `ls` List the keys in the current range.

![img](/doc/4.png)

#### `start [string]` Sets the start of the current range
When `createReadStream()` is created on the current sublevel (or root)
it will use this value as a parameter.

#### `end [string]` Sets the lower bound of the current range

#### `limit [number]` Limit the number of results in the current range

#### `reverse` Reverse the results in the current range

#### `get [string]` Get a value from the current range

#### `cd [string]` Set the current sublevel

Supports `cd ..` to navigate down a level. `cd /` to navigate to the 
root of the database. And supports paths `cd foo/bar/bazz`.

## USER SETTINGS
You can create a `.lev` file in your home directory and it will be used 
to set the defaults. Command line arguments will override the default 
settings in this file.

```json
{
  "defaults": {
    "createIfMissing": true,
    "valueEncoding": "json",
    "keyEncoding": "json",
    "compression": "true",
    "cacheSize": 8388608
  }
}
```

[0]:https://github.com/rvagg/node-levelup
[1]:https://github.com/juliangruber/multilevel
[2]:http://www.iterm2.com/
[3]:http://software.schmorp.de/pkg/rxvt-unicode.html

## License
MIT
