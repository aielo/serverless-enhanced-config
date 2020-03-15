### Example: Simple

This example demonstrates a basic usage of **serverless-enhanced-config**.

`serverless.yml` is used as an entry point for the Serverless Framework and **serverless-enhanced-config**, including:
- `service` and `provider` sections, which are mandatory in the Serverless Framework
- `serverless-enhanced-config` in the plugins section
- `custom.enhancedConfig`, containing in specific **serverless-enhanced-config** settings:
  - The configuration template path at `template`
  - Variables to be replaced in the template under `variables`

The *actual* serverless configuration to be used by the Serverless Framework will be generated in runtime. You can easily check that with the `print` command.

Try it with `npm`:
```
$ git clone https://github.com/aielo/serverless-enhanced-config.git
$ cd serverless-enhanced-config/examples/simple/
$ npm install serverless -g
$ npm install
$ sls print
```
or `yarn`:
```
...
$ yarn global add serverless
$ yarn install
$ sls print
```

For debugging output, use `SLS_EC_DEBUG`:
```
$ SLS_EC_DEBUG=1 sls print
```
