# Portal server library

This library help you to set up a [Nest.js](https://nestjs.com/) server to serve a dynamic luigi configuration.
It is closely related to the [portal ui library](https://github.com/openmfp/portal-ui-lib).

Main features of this library are:

* Provide a Dynamic Luigi configuration, without the need to deploy a library
* Authentication capabilities with GitHub and IAS
* Dynamic development capabilities - Embed your local MicroFrontend into a running luigi frame.

# Getting started

## Set up environment

In order to be able to use the library following environment properties have to be provided:

- **Mandatory**

| Property name             | Description                                                                                                                                                                                     |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| IDP_NAMES                 | Comma separated values of the name(s) of the Identity Providers (IDPs) used for authentication.                                                                                                 |
| BASE_DOMAINS_${idp}       | Comma separated values of base domains for the application.                                                                                                                                     |
| IAS_TENANT_URL_${idp}     | The URL for the IAS (Identity and Access Management) tenant specific to the idp name. This URL is used for interactions with the IAS service, such as user authentication and authorization.    |
| OIDC_CLIENT_ID_${idp}     | Client ID for the OpenID Connect (OIDC) configuration. The Client ID is used to identify the application to the OIDC provider (e.g., an authorization server).                                  |
| OIDC_CLIENT_SECRET_${idp} | Client Secret for the OIDC configuration. The Client Secret is a confidential value known only to the application and the OIDC provider, used to authenticate the application to the provider.  |

- **Optional**

| Property name                    | Description                                                                                                                        |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| HEALTH_CHECK_INTERVAL            | The interval in *milliseconds* at which the application performs health checks to ensure its components are functioning correctly. |
| ENVIRONMENT                      | This property indicates the environment in which the application is running, *local* indicates development environment.            |
| FRONTEND_PORT                    | This property sets the port number on which the frontend of the application will run in *local* environment.                       |

Below is an example of a `.env` file for configuring the application:

```properties
IDP_NAMES=app

BASE_DOMAINS_APP=localhost
IAS_TENANT_URL_APP=https://example.com
OIDC_CLIENT_ID_APP=app_client_id
OIDC_CLIENT_SECRET_APP=app_client_secret

HEALTH_CHECK_INTERVAL=
ENVIRONMENT=local
FRONTEND_PORT=4301
```

## Consuming the library

This library needs a main project to run.

### Import the module 

The library exposes a Nest module as an api.

```ts
import { NestFactory } from '@nestjs/core';
import { PortalModule } from '@portal/server-lib';

const app = await NestFactory.create(
    PortalModule.create({
     healthChecker: OpenHealthChecker,
  }),
);

// bootstrap the app
```
