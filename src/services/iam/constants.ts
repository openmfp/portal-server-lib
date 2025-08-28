import { EntityType } from './models/entity-type.js';

/**
 * The admin policies that were available before fga was enabled for any entity (team, project).
 */
const legacyAdminPolicies = [
  'iamAdmin',
  'iamMember',
  'waasAdmin',
  'metadataAdmin',
  'sentryViewer',
  'argocdViewer',
  'gardenerViewer',
  'githubAdmin',
  'accountAdmin',
  'extensionAdmin',
  'vaultMaintainer',
];

/**
 * The member policies that were available before fga was enabled for any entity (team, project).
 */
const legacyMemberPolicies = [
  'waasAdmin',
  'iamMember',
  'metadataAdmin',
  'sentryViewer',
  'argocdViewer',
  'gardenerViewer',
  'githubMember',
];

/**
 * A map that maps the fga role names to the respective legacy policy names which are available for a Project.
 * The map maps the fga role name to the set of equivalent legacy policies.
 */
const fgaRolesToLegacyPoliciesForProjects = new Map<string, string[]>([
  ['member', [...legacyMemberPolicies, 'projectMember']],
  ['owner', [...legacyAdminPolicies, 'projectAdmin']],
  ['vault_maintainer', ['vaultMaintainer']],
]);

/**
 * A map that maps the fga role names to the respective legacy policy names which are available for a Team.
 * The map maps the fga role name to the set of equivalent legacy policies.
 */
const fgaRolesToLegacyPoliciesForTeams = new Map<string, string[]>([
  ['member', legacyMemberPolicies],
  ['owner', legacyAdminPolicies],
  ['vault_maintainer', ['vaultMaintainer']],
]);

/**
 * A map that maps the entity type (project, team) to the respective map of fga roles and legacy policies.
 */
export const fgaRolesAndLegacyPolicies = new Map<
  EntityType,
  Map<string, string[]>
>([
  [EntityType.Project, fgaRolesToLegacyPoliciesForProjects],
  [EntityType.Team, fgaRolesToLegacyPoliciesForTeams],
]);
