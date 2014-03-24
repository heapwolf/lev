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
This is the mode entered when you type `lev` with no arguments.
I recommend a modern terminal program like [iTerm2][2] on OSX or
[urxvt] on Linux.

On the left you have a list of keys, on the right you have the
selected value. You can edit the selected value by clicking on it.
Save the modified value by pressing `control+s`.

![img](/doc/1.png)

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

Provide just a path and no flags to start the REPL.
```bash
$lev path/to/db
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
A `.lev` file will be created in your home directory. You can manage this
will the TUI or by hand.

```json
{
  "query": {
    "start": "",
    "end": "",
    "reverse": false,
    "limit": 1000
  },
  "key": null,
  "connections": {
    "Default":{
      "path":"",
      "keyEncoding":"utf8",
      "valueEncoding":"json",
      "local":true,
      "compression":true,
      "cacheSize":8388608
    }
  }
}
```

[0]:https://github.com/rvagg/node-levelup
[1]:https://github.com/juliangruber/multilevel
[2]:http://www.iterm2.com/
[3]:http://software.schmorp.de/pkg/rxvt-unicode.html

## License
MIT
