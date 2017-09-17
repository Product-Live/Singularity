<div align="center">
  <a href="https://github.com/Product-Live/Singularity">
    <img width="200" heigth="200" src="https://github.com/Product-Live/Singularity/blob/master/documentation/assets/logo.png?raw=true">
  </a>
  
  <h1>Singularity</h1>
  
  <p>A NodeJS framework oriented towards organizing code into modules for service based applications.</p>
</div>

#### `Quick start`
Here is the a example for the setup of a basic project/service
```shell
    mkdir project && cd project
    git init
    git submodule add https://github.com/Product-Live/Singularity.git Singularity
    cp Singularity/engine/core/skeleton/main.js main.js
    cp Singularity/engine/core/skeleton/ignore .gitignore
    node main.js --skeleton app
    node main.js --skeleton module --name worker
```
One liner version
```shell
    a="project" && mkdir $a && cd $a && git init && git submodule add https://github.com/Product-Live/Singularity.git Singularity && cp Singularity/engine/core/skeleton/main.js main.js && cp Singularity/engine/core/skeleton/ignore .gitignore && node main.js --skeleton app && node main.js --skeleton module --name worker
```

#### `Cloning a submodule project`
Fresh clone of a project
```shell
    git clone --recursive git://github.com/user/project.git
```
On a already cloned project
```shell
    git clone git://github.com/user/project.git
    cd bar
    git submodule update --init --recursive
```

## Project structure
This is what the skeleton app looks like
* app
    * boostrap
        * worker.js (profile to start a project)
    * config (optional)
        * config_files (split config)
    * module
        * module_name
            * controller
            * config.js (dependencies, route, cdn, import)
        * ...
    * resources
        * cache
        * logs
        * .machineSession (unique key)
    * config.js (config object loaded into $.config)
* Singularity (submodule)
* main.js (entry point)

## Documentation
[TODO](documentation/README.md)

## Dependencies
These are the base npm dependencies used in the framework
- bcryptjs
- mongodb
- sha512crypt-node
- ws
- request

you can add extra dependencies into package.dependencies in config or in a module's config.

### FAQ

##### what's your favorite color
yes

## Changelog
TODO

## License

[Apache License 2.0](LICENSE)