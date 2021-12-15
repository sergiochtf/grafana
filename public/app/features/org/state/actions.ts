import { ThunkResult } from 'app/types';
import { getBackendSrv } from '@grafana/runtime';
import { organizationLoaded } from './reducers';
import { updateConfigurationSubtitle } from 'app/core/actions';
import { getConfig } from 'app/core/config';

type OrganizationDependencies = { getBackendSrv: typeof getBackendSrv };

export function loadOrganization(
  dependencies: OrganizationDependencies = { getBackendSrv: getBackendSrv }
): ThunkResult<any> {
  return async (dispatch) => {
    const organizationResponse = await dependencies.getBackendSrv().get('/api/org');
    dispatch(organizationLoaded(organizationResponse));

    return organizationResponse;
  };
}

export function updateOrganization(
  dependencies: OrganizationDependencies = { getBackendSrv: getBackendSrv }
): ThunkResult<any> {
  return async (dispatch, getStore) => {
    const organization = getStore().organization.organization;

    await dependencies.getBackendSrv().put('/api/org', { name: organization.name });

    dispatch(updateConfigurationSubtitle(organization.name));
    dispatch(loadOrganization(dependencies));
  };
}

export function setUserOrganization(
  orgId: number,
  dependencies: OrganizationDependencies = { getBackendSrv: getBackendSrv }
): ThunkResult<any> {
  return async (dispatch) => {
    const organizationResponse = await dependencies.getBackendSrv().post('/api/user/using/' + orgId);

    dispatch(updateConfigurationSubtitle(organizationResponse.name));
  };
}

export function createOrganization(
  newOrg: { name: string },
  dependencies: OrganizationDependencies = { getBackendSrv: getBackendSrv }
): ThunkResult<any> {
  return async (dispatch) => {
    const result = await dependencies.getBackendSrv().post('/api/orgs/', newOrg);

    dispatch(setUserOrganization(result.orgId));
    window.location.href = getConfig().appSubUrl + '/org';
  };
}

export function validateOrganization(
  orgName: string,
  dependencies: OrganizationDependencies = { getBackendSrv: getBackendSrv }
): ThunkResult<any> {
  return async () => {
    try {
      await dependencies.getBackendSrv().get(`api/orgs/name/${encodeURI(orgName)}`);
    } catch (error) {
      if (error.status === 404) {
        error.isHandled = true;
        return true;
      }
      return 'Something went wrong';
    }
    return 'Organization already exists';
  };
}
