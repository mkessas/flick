# node-flick

## Overview 

A RESTful API to retrieve, store, and expose Flick Electric unit prices for a given account.  This standalone service is powered by Express and is intended to run as a background service.  It serves two purposes:

- It will leverage the smartphone API to retrieve the current electricity price for a given account at regular intervals (configurable)
- It exposes a REST endpoint where the prices and the daily low & high are made available as a JSON object.

## Requirements

### General

In order to run the daemon as-is, a Linux x64 system is required since the node binary is included in the package.  Using an alternate architecture (non-Windows) is a simple matter of replacing the node binary (under `sbin/`) with the correct version.

Alternately, you could simply pluck out the `modules/flick.js` file and reuse it as you please.

### Database

The service is intended to store every reading that is acquires from Flick (usually at 10 minute intervals) to a database.  This can be useful in a variety of ways such particularly in home automation.

Though you can disable writing a DB entirely, it's not recommended.  Disabling DB support is done by setting `enabled` to `false` under the `[db]` heading in the `etc/flick.properties` file.

The only database provider that is supported at the moment is MongoDB.  It is typically a quick and painless installation using the Linux package manager of your choice (`apt-get install mongodb` in Ubuntu/Debian or `yum install mongodb-org` in CentOS).  Once the package is installed, you start the service and that's it.  The Flick service will know what to do.  You may need to adjust the `url` under `[db]` if you want your DB to run in a remote host.

Alternately, you can use the free MongoDB service from `mlab.com`.  It provides a good alternative to those that don't want a local DB service running.

## Installation

The simplest way to install this is to clone the git repo:

```sh
$ git clone https://github.com/mkessas/node-flick.git
```

## Configuration

All configurable aspects of the daemon are read from the `etc/flick.properties` file.  Make all your changes there.  Be sure to substitute the placeholder values of the flick account with your own.

Please avoid reducing the `interval` to less than `600` as it would not yield any benefit.

## Running

You can invoke the script manually using:

```sh
$ cd bin && ./flick
``` 

or using `nohup`

```sh
$ cd bin && nohup ./flick >> ../flick.log 2>&1 &
```

## Testing

The two endpoints currently defined are `/api/price` and `/api/update`

### Retrieve Price

From a web browser, or a command line tool, you can issue a `GET` against `/api/price`

```sh
$ curl -sq http://localhost:3000/api/price | python -m json.tool
{
    "details": {
        "max": {
            "_id": "59451eb82206a7ce027e1cd6",
            "price": 29.6,
            "total": 34.04,
            "updated": "2017-06-17T12:21:12.102Z"
        },
        "min": {
            "_id": "59453d362206a7ce027e1ce3",
            "price": 21.56,
            "total": 24.79,
            "updated": "2017-06-17T14:31:18.976Z"
        },
        "price": {
            "_id": "59463a562206a7ce027e1d4f",
            "price": 25.27,
            "total": 29.06,
            "updated": "2017-06-18T08:31:18.480Z"
        }
    },
    "status": "ok"
}
```

### Force Reload

If you want to force-reload the prices before the standard refresh cycle is complete, you can issue a `GET` request against the `/api/update` endpoint as such:

```sh
$ curl -sq http://localhost:3000/api/update | python -m json.tool
{
    "details": "Triggered Price Update",
    "status": "ok"
}

```

## Troubleshooting

Enable debugging in the `etc/flick.properties` file under the `[general]` section (set `debug` to `true`)


## Sample Use-Case

Here is a light-weight Angular application that leverages this API to display prices in a browser.

![Angular App Screenshot](https://github.com/mkessas/node-flick/raw/master/flick.png)
