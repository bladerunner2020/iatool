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
$ iatool <host> [command] [options]
```

host - ip address of IAdea media player or signboard. 
NOTE: if IADEA_HOST is specified as an environment variable or in .ENV file, host argument may be omitted.

**commands**

```
    display <status>              turn display on/off
    switch                        switch to play default content 
    autostart <file>              set default content to play each time player boots up 
    fallback <file>               set content to play on critical errors 
    remove [options] [file]       remove file(s) matching criteria
    upload <source> [destinatio]  upload file
```

```iatool <host> info```
show information on the player (model, firmware, storage, etc).

```iatool <host> list [options] [filter]```
Display list of files on the player. If optional parameter *filter* is specified, only files that contains *filter* are listed.
It is possible to specify the information that should be displayed on each file.

The followin otions are available:
```  
    -h, --help             output usage information
    -p, --downloadPath     add downloadPath to the list
    -i, --id               add file id to the list
    -s, --fileSize         add fileSize to the list
    -z, --transferredSize  add transferredSize to the list
    -t, --mimeType         add mimeType to the list
    -d, --createdDate      add createdDate to the list
    -m, --modifiedDate     add modifiedDate to the list
    -c, --completed        add completed flag to the list
    ```
The default options are *-psc*.

Example:
    ```
    $ iatool <host> list -pstc
---------------------------------------------------------------------
DOWNLOADPATH              | FILESIZE   | MIMETYPE         | COMPLETED
---------------------------------------------------------------------
index.smil                | 6611       | application/smil | true     
media/index2.smil         | 180        | application/smil | true     
media/image1.jpg          | 190936     | image/jpeg       | true     
media/image3.jpg          | 236185     | image/jpeg       | true     
media/image2.jpg          | 773970     | image/jpeg       | true     
safe.smil                 | 147        | application/smil | true     
media/video1.5d43a661.mp4 | 1157541301 | video/mp4        | true     
slideshow.smil            | 358        | application/smil | true     
media/video.mp4           | 1578331716 | video/mp4        | true     
---------------------------------------------------------------------
Total: 9 file(s). Size: 2.55 Gb (2737081404 bytes)
    ```

```iatool <host> play <file>```
Play specified file or external URL once. It could be a media file, SMIL playlist or html-page.
It's possible to specify full path or file name or part of file name. 
If more then one files match the criteria only one will be played.
*NOTE:* it's also possible to specify external URL.

Examples:
```iatool <host> play media/image1.jpg
iatool 192.168.2.12 play media/image1.jpg
Playing: http://localhost:8080/v2/user-data/media/image1.jpg
```

```iatool <host> play video.mp4
iatool 192.168.2.12 play media/video.mp4
Playing: http://localhost:8080/v2/user-data/media/video.mp4

```

To play external URL:
```iatool <host> play http://www.auvix.ru
Playing: http://www.auvix.ru
```




### Contribution ###

If you would like to contribute, please fork the repo and send in a pull request.

### License ###

(The MIT License)
Copyright (c) 2017 Alexander Pivovarov <pivovarov@gmail.com>