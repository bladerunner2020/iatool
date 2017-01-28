# README #

A command line tool for Iadea players and signboards.

### Installation ###

```sh
npm install --global iadea-tool
```

### Usage examples ###
Usage: node iatool [command] [options]

To get full list of commands run:

node iatool --hlep

  Usage: iatool [options] [command]

  Commands:

    info                          show information on the player
    list [options] [filter]       display file list
    play <file>                   play a media or smil file
    display <status>              turn display on/off
    switch                        switch to play default content 
    autostart <file>              set default content to play each time player boots up 
    fallback <file>               set content to play on critical errors 
    remove [options] [file]       remove file(s) matching criteria
    upload <source> [destinatio]  upload file

  Options:

    -h, --help  output usage information
   

### Contribution ###

If you would like to contribute, please fork the repo and send in a pull request.

### License ###

(The MIT License)
Copyright (c) 2017 Alexander Pivovarov <pivovarov@gmail.com>