# Portal server library

This library help you to set up a [Nest.js](https://nestjs.com/) server to serve a dynamic luigi configuration.
It is closely related to the [portal ui library](https://github.com/openmfp/portal-ui-lib).

Main features of this library are:

* Provide a Dynamic Luigi configuration, without the need to deploy a library
* Authentication capabilities with GitHub and IAS
* Dynamic development capabilities - Embed your local MicroFrontend into a running luigi frame.

## Getting started

The library exposes a Nest module as an api.

```ts
import { NestFactory } from '@nestjs/core';
import { FrameModule } from '@portal/server-lib';

const app = await NestFactory.create(
  FrameModule.create({
     healthChecker: OpenHealthChecker,
  }),
);

// bootstrap the app
```

` 

## Consuming the library

This library needs a main project to run.

### Build

1. Build and watch the library for changes:
    ```bash
    npm run build:watch
    ```