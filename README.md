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

## showcase

in this project, the package.json is:
```json
{
  "name": "npm-locker",
  "version": "1.0.0",
  "dependencies": {
    "shelljs": "^0.6.0"
  }
}
```

after run npm-lock, a lockfile `npm-shrinkwrap.json` is create,
and the node modules relate to you project

```json
{
    "name": "npm-locker",
    "version": "1.0.0",
    "dependencies": {
        "shelljs": {
            "version": "0.6.0",
            "from": "shelljs@*",
            "resolved": "./node_packages/shelljs.tgz"
        }
    }
}
```

and all your packages are in `node_packages`

have fun!
