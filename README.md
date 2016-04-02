# npm-locker
use npm shrinkwrap and pack all your dependences to node_packages

## usage

```shell
# 1. add npm-locker to your project
npm i npm-locker --save-dev
# or global
npm i -g npm-locker
# 2. if you install local, add lock script to npm script(in package.json)
npm-lock
# 3. run in your project
```

## showcase

for example, in some project, the package.json is:

```json
{
  "name": "awesome-project",
  "version": "1.0.0",
  "scripts": {
    "lock": "npm-lock"
  },
  "dependencies": {
    "npm-locker": "^1.1.0"
  }
}
```

First, you need run `npm shrinkwrap`,
then a lockfile `npm-shrinkwrap.json` is created.

Secondly, run `npm run lock`,
and `node_packages` is created and include all the
dependencies for you, also the `npm-shrinkwrap.json` will replace the resolve
field relate to you project

```json
{
    "name": "awesome-project",
    "version": "1.0.0",
    "dependencies": {
        "npm-locker": {
            "version": "1.1.0",
            "from": "npm-locker@^1.1.0",
            "resolved": "./node_packages/npm-locker-1.1.0.tgz"
        }
    }
}
```

and all your packages are in `node_packages`

have fun!

## feature

[x] no dependencies
[ ] auto download from network
[ ] auto run `npm shrinkwrap` (in some node envirenment, it will crash)
