<?php

// This is a compiled Agavi configuration file
// Compiled from: /usr/local/lconf-standalone/app/modules/AppKit/config/module.xml
// Generated by: AgaviModuleConfigHandler
// Date: 2011-09-02T13:02:09+0000

$lcModuleName = strtolower($moduleName);
AgaviConfig::set(AgaviToolkit::expandVariables('modules.${moduleName}.enabled', array('moduleName' => $lcModuleName)), true, true, true);
$moduleConfig = array (
  'modules.${moduleName}.title' => 'AppKit Module',
  'modules.${moduleName}.version' => '1.0',
  'modules.${moduleName}.authors' => 
  array (
    'info@icinga.org' => 'icinga developer team',
  ),
  'modules.${moduleName}.homepage' => 'http://www.icinga.org',
  'modules.${moduleName}.update_url' => NULL,
  'modules.${moduleName}.description' => 'Appkit main application kit',
  'modules.${moduleName}.doctrine_path' => '/usr/local/lconf-standalone/lib/doctrine/',
  'modules.${moduleName}.doctrine_use_compressed' => true,
  'modules.${moduleName}.php_settings' => 
  array (
    'session.gc_probability' => '3',
    'session.gc_divisor' => '100',
    'session.gc_maxlifetime' => '86400',
    'date.timezone' => 'GMT',
  ),
  'modules.${moduleName}.squishloader' => 
  array (
    'cache_dir' => '/usr/local/lconf-standalone/app/cache/Squished',
    'use_caching' => true,
  ),
  'modules.${moduleName}.user_preferences_default' => 
  array (
    'org.icinga.grid.pagerMaxItems' => '25',
    'org.icinga.grid.refreshTime' => '300',
    'org.icinga.grid.outputLength' => '70',
    'org.icinga.tabslider.changeTime' => '10',
    'org.icinga.cronk.default' => 'portalHello',
    'org.icinga.bugTrackerEnabled' => true,
    'org.icinga.errorNotificationsEnabled' => true,
    'org.icinga.autoRefresh' => true,
    'org.icinga.status.refreshTime' => '60',
  ),
  'modules.${moduleName}.js_config_mapping' => 
  array (
    'path' => 'org.icinga.appkit.web_path',
    'image_path' => 'org.icinga.appkit.image_path',
    'core.app_name' => NULL,
    'org.icinga.version.copyright' => NULL,
    'org.icinga.version.homeref' => NULL,
    'org.icinga.version.major' => NULL,
    'org.icinga.version.minor' => NULL,
    'org.icinga.version.patch' => NULL,
    'org.icinga.version.extension' => NULL,
    'org.icinga.version.releasedate' => NULL,
    'org.icinga.version.name' => NULL,
  ),
  'modules.${moduleName}.ajax.timeout' => '240000',
  'modules.${moduleName}.agavi.include.css' => 
  array (
    0 => '/usr/local/lconf-standalone/app/modules/AppKit/config/css.xml',
  ),
  'modules.${moduleName}.agavi.include.javascript' => 
  array (
    0 => '/usr/local/lconf-standalone/app/modules/AppKit/config/javascript.xml',
  ),
  'modules.${moduleName}.agavi.include.menu' => 
  array (
    0 => '/usr/local/lconf-standalone/app/modules/AppKit/config/menu.xml',
  ),
  'modules.${moduleName}.agavi.include.routing' => 
  array (
    0 => '/usr/local/lconf-standalone/app/modules/AppKit/config/routing.xml',
  ),
  'modules.appkit.auth.behaviour.enable_silent' => true,
  'modules.appkit.auth.behaviour.enable_dialog' => true,
  'modules.appkit.auth.behaviour.store_loginname' => true,
  'modules.appkit.auth.defaults' => 
  array (
    'auth_create' => false,
    'auth_update' => false,
    'auth_resume' => true,
    'auth_groups' => 'icinga_user',
    'auth_enable' => false,
    'auth_authoritative' => false,
  ),
  'modules.appkit.auth.provider' => 
  array (
    'internal' => 
    array (
      'auth_module' => 'AppKit',
      'auth_provider' => 'Auth.Provider.Database',
      'auth_enable' => true,
      'auth_authoritative' => true,
    ),
    'auth_key' => 
    array (
      'auth_module' => 'AppKit',
      'auth_provider' => 'Auth.Provider.AuthKey',
      'auth_enable' => true,
      'auth_authoritative' => true,
    ),
    'http-basic-authentication' => 
    array (
      'auth_module' => 'AppKit',
      'auth_provider' => 'Auth.Provider.HTTPBasicAuthentication',
      'auth_enable' => true,
      'auth_authoritative' => true,
      'http_uservar' => 'REMOTE_USER,PHP_AUTH_USER',
      'http_typevar' => 'AUTH_TYPE',
      'http_source' => '_SERVER',
    ),
  ),
  'modules.appkit.auth.message' => 
  array (
    'show' => true,
    'title' => 'Welcome',
    'text' => NULL,
    'include_file' => '/usr/local/lconf-standalone/app/data/share/login_message.html',
    'expand_first' => false,
  ),
);
$moduleConfigKeys = array_keys($moduleConfig);
foreach($moduleConfigKeys as &$value) $value = AgaviToolkit::expandVariables($value, array('moduleName' => $lcModuleName));
$moduleConfig = array_combine($moduleConfigKeys, $moduleConfig);
AgaviConfig::fromArray($moduleConfig);

?>