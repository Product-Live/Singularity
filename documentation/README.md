<div align="center">
  <a href="https://github.com/Product-Live/Singularity">
    <img width="200" heigth="200" src="https://github.com/Product-Live/Singularity/blob/master/documentation/assets/logo.png?raw=true">
  </a>
  
  <h1>Singularity</h1>
  
  <p>A NodeJS framework oriented towards organizing code into modules for service based applications.</p>
</div>

TODO

## Module config
```js
{
    dependencies: {
        'ws': 'latest'
    },
    route: [
        'config/info.js',
        {
            method: ['get'],
            path: '/health',
            action: {
                controller: 'info',
                method: 'health'
            }
        }
    ],
    cdn: [
        {
            path: '/public/',
            priority: 1,
            source: 'public'
        }
    ],
    import: [
        {
            module: 'other_module',
            as: 'alias',
            path: '/entity/object.js'
        }
    ]
}
```

## Command
You can add your own commands in main.js example:
```js
core({
    absoluteRoot: base,
    projectRoot: base + '/app',
    command: function(c, config) {
        c.if('foo', function() {
            config.env = c.get('foo') || 'bar'
        });
    }
});
```
