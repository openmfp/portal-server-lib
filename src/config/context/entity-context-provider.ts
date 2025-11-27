import { Type } from '@nestjs/common';

export interface EntityContextProvider {
  getContextValues(
    token: string,
    context: Record<string, any>,
  ): Promise<Record<string, any>>;
}

class EntityException extends Error {
  entityType: string;
  entityId: string;

  constructor(entityType: string, entityId: string, msg: string) {
    super(msg);
    this.entityType = entityType;
    this.entityId = entityId;
  }
}

export class EntityNotFoundException extends EntityException {
  constructor(entityType: string, entityId: string) {
    super(
      entityType,
      entityId,
      `${entityType} with id ${entityId} doesn't exist.`,
    );
  }
}

export class EntityAccessForbiddenException extends EntityException {
  constructor(entityType: string, entityId: string) {
    super(
      entityType,
      entityId,
      `Access forbidden for ${entityType} with id ${entityId}.`,
    );
  }
}

export type EntityContextProviders = Record<
  string,
  Type<EntityContextProvider> | string | symbol
>;
