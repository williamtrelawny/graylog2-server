/* eslint-disable camelcase */
// @flow strict
import type { LdapConfigJson, LdapConfig } from './types';

const toJson = ({
  servers,
  systemUserDn,
  systemUserPassword,
  transportSecurity,
  type,
  userFullNameAttribute,
  userNameAttribute,
  userSearchBase,
  userSearchPattern,
  verifyCertificates,
}: LdapConfig): LdapConfigJson => ({
  servers,
  system_user_dn: systemUserDn,
  system_user_password: { is_set: systemUserPassword.isSet },
  transport_security: transportSecurity,
  type: type,
  user_full_name_attribute: userFullNameAttribute,
  user_name_attribute: userNameAttribute,
  user_search_base: userSearchBase,
  user_search_pattern: userSearchPattern,
  verify_certificates: verifyCertificates,
});

const fromJson = ({
  servers,
  system_user_dn,
  system_user_password,
  transport_security,
  type,
  user_full_name_attribute,
  user_name_attribute,
  user_search_base,
  user_search_pattern,
  verify_certificates,
}: LdapConfigJson): LdapConfig => ({
  servers,
  systemUserDn: system_user_dn,
  systemUserPassword: { isSet: system_user_password.is_set },
  transportSecurity: transport_security,
  type: type,
  userFullNameAttribute: user_full_name_attribute,
  userNameAttribute: user_name_attribute,
  userSearchBase: user_search_base,
  userSearchPattern: user_search_pattern,
  verifyCertificates: verify_certificates,
});

export default { fromJson, toJson };
