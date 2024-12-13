# Portal server library

This library help you to set up a [Nest.js](https://nestjs.com/) server to serve a dynamic luigi configuration.
It is closely related to the [portal ui library](https://github.com/openmfp/portal-ui-lib).

Main features of this library are:

* Provide a Dynamic Luigi configuration, without the need to deploy a library
* Authentication capabilities with GitHub and Auth Server
* Dynamic development capabilities - Embed your local MicroFrontend into a running luigi frame.

# Getting started

## Set up environment

In order to be able to use the library following environment properties have to be provided:

- **Mandatory**

| Property name             | Description                                                                                                                                                                                    |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| IDP_NAMES                 | Comma separated values of the name(s) of the Identity Providers (IDPs) used for authentication.                                                                                                |
| BASE_DOMAINS_${idp}       | Comma separated values of base domains for the application.                                                                                                                                    |
| AUTH_SERVER_URL_${idp}    | The URL for the authentication service provider specific to the idp name. This URL is used for retrieveing an authenticating a user.                                                           |
| TOKEN_URL_${idp}          | The URL for the authentication token service provider specific to the idp name. This URL is used for retrieveing an auth tokens.                                                               |
| OIDC_CLIENT_ID_${idp}     | Client ID for the OpenID Connect (OIDC) configuration. The Client ID is used to identify the application to the OIDC provider (e.g., an authorization server).                                 |
| OIDC_CLIENT_SECRET_${idp} | Client Secret for the OIDC configuration. The Client Secret is a confidential value known only to the application and the OIDC provider, used to authenticate the application to the provider. |

- **Optional**

| Property name           | Description                                                                                                                                                                                                 |
|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| HEALTH_CHECK_INTERVAL   | The interval in *milliseconds* at which the application performs health checks to ensure its components are functioning correctly. Default 2000 ms.                                                         |
| LOGOUT_REDIRECT_URL     | The url to redirect user after logout action, by default */logout*.                                                                                                                                         |
| ENVIRONMENT             | This property indicates the environment in which the application is running, *local* indicates development environment.                                                                                     |
| DEVELOPMENT_INSTANCE    | This property indicates if the portal runs in development mode.                                                                                                                                             |
| FRONTEND_PORT           | Set the port number on which the frontend of the application will run in *local* environment.                                                                                                               |
| VALID_WEBCOMPONENT_URLS | To enable CORS Web component Loading: basically you need to add external domains where the Web Components are hosted; `".?"` in this examle, we are sepcify that we can load Web Components from everyhere. |
| FEATURE_TOGGLES         | Comma separated values of features following the convention `featureName=boolean`. Boolean value indicates is the feature is on/off (true/false)                                                            |

Below is an example of a `.env` file for configuring the application:

```properties
IDP_NAMES=app,dev

BASE_DOMAINS_APP=localhost,example.com
AUTH_SERVER_URL_APP=https://example.com/auth
TOKEN_URL_APP=https://example.com/token
OIDC_CLIENT_ID_APP=app_client_id
OIDC_CLIENT_SECRET_APP=app_client_secret

HEALTH_CHECK_INTERVAL=
LOGOUT_REDIRECT_URL="/logout"
FEATURE_TOGGLES="foo=true,boo=false"
ENVIRONMENT=local
DEVELOPMENT_INSTANCE=true
FRONTEND_PORT=4300
VALID_WEBCOMPONENT_URLS=".?"
```

## Consuming the library

This library exposes a Nest module as an api and needs a main project to run.

### Import the module

```ts
import { NestFactory } from '@nestjs/core';
import { PortalModule } from '@portal/server-lib';

async function bootstrap() {
  const app = await NestFactory.create(
    PortalModule.create({
     healthChecker: OpenHealthChecker,
  }));
  await app.listen(process.env.PORT || 3000);
}

// bootstrap the app
bootstrap();
```

## Requirements

The portal requires a installation of node.js and npm.
Checkout the [package.json](package.json) for the required node version and dependencies.

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file in this repository for instructions on how to contribute to openMFP.

## Code of Conduct

Please refer to the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file in this repository for information on the expected Code of Conduct for contributing to openMFP.

## Licensing

Copyright 2024 SAP SE or an SAP affiliate company and openMFP contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/openmfp/portal-server-lib).
