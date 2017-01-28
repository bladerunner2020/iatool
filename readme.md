# README #

A command line tool for Iadea players and signboards.

### Installation ###
To use iadea-tool [NODE.JS](https://nodejs.org/) should be installed.
To install iadea-tool:
```
npm install --global iadea-tool
```

### Usage examples ###
Usage: 

```
$ iatool host [command] [options]
```

host - ip address of IAdea media player or signboard. 
NOTE: if IADEA_HOST is specified as an environment variable or in .ENV file, host argument may be omitted.

**commands**

```
    info                          show information on the player
    list [options] [filter]       display file list.
    play <file>                   play a media or smil file
    display <status>              turn display on/off
    switch                        switch to play default content 
    autostart <file>              set default content to play each time player boots up 
    fallback <file>               set content to play on critical errors 
    remove [options] [file]       remove file(s) matching criteria
    upload <source> [destinatio]  upload file
```

*command: info*






### Contribution ###

If you would like to contribute, please fork the repo and send in a pull request.

### License ###

(The MIT License)
Copyright (c) 2017 Alexander Pivovarov <pivovarov@gmail.com>