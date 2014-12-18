# LConf Web Installation

## Requirements

* web-server
* PHP >= 5.2
* php-sqlite3
* sqlite3
* php-xml
* php-xsl
* php-ldap

## Setup

Installing the lconf-web standalone package is almost like icinga-web, altough you don't need database credentials, as sqlite will be used for storage:

    ./configure (see --help for options)

    make install

Check your permissions on `app/data/lconf.db`, www-user needs write permissions (to both the file AND the folder!).


# Release Checklist

Update `doc/AUTHORS` and `.mailmap` file

    git log --use-mailmap | grep ^Author: | cut -f2- -d' ' | sort | uniq > doc/AUTHORS

Import the Icinga Web module source

    cd ../icinga-module
    git checkout support/1.4 && git pull origin support/1.4

    cp -rv ../icinga-module/src/LConf app/modules/

Update version

    vim etc/make/version.m4
    autoconf
