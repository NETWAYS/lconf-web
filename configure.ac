#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

# include some meta
m4_include([etc/make/version.m4])

# Which version of AC
AC_PREREQ(2.61)

# Init project
AC_INIT(lconf, [LCONF_VERSION], [netways.org])

# Release date
RELEASE_DATE=LCONF_RELEASE_DATE

AC_PREFIX_DEFAULT(/usr/local/lconf-web)

if test "x$prefix" = "xNONE" ; then
    installDir="/usr/local/lconf-web"
    prefix=$installDir
else
    installDir=$prefix 
fi

# Checks for programs.
AC_PROG_INSTALL
AC_PROG_GREP
AC_PROG_SED

# Extract version parts
ACICINGA_EXTRACT_VERSION([VERSION_MAJOR],[VERSION_MINOR],[VERSION_PATCH],[VERSION_EXTEN])

AC_SUBST(VERSION_MAJOR)
AC_SUBST(VERSION_MINOR)
AC_SUBST(VERSION_PATCH)
AC_SUBST(VERSION_EXTEN)
AC_SUBST(RELEASE_DATE)

# Check for php
AC_ARG_VAR([PHP],[php cli binary])
ACICINGA_CHECK_BIN([PHP], [php])

# Check for mysql
AC_ARG_VAR([SQLITE],[sqlite client binary])
ACICINGA_CHECK_BIN([SQLITE], [sqlite3])

# Checks for libraries.

# Checks for header files.

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.

# Define install options

# Meta option
AC_ARG_WITH([app_name],
    AS_HELP_STRING([--with-app-name=NAME], [Application name (default LConf)]),
    app_name=$withval,
    app_name=LConf
)

# Users for webfiles
AC_ARG_WITH([web_user],
    AS_HELP_STRING([--with-web-user=USER], [username for web writable files (default www-data)]),
    web_user=$withval,
    ACICINGA_USER_GUESS([www wwwrun www-data apache httpd nobody],[web_user],[www-data])
)

AC_ARG_WITH([web_group],
    AS_HELP_STRING([--with-web-group=GROUP], [group for web writable files (default www-data)]),
    web_group=$withval,
    ACICINGA_GROUP_GUESS([www www-data apache httpd nogroup nobody],[web_group], [www-data])
)

AC_ARG_WITH([web_path],
    AS_HELP_STRING([--with-web-path=PATH], [web sub path (default /lconf)]),
    web_path=$withval,
    web_path=/lconf
)

AC_ARG_WITH([web_absolute_path],
    AS_HELP_STRING([--with-web-absolute-path=PATH], [absolute path to pub (default %core.root_dir%/pub)]),
    web_absolute_path=$withval,
    web_absolute_path=%core.root_dir%/pub
)

AC_ARG_WITH([web_apache_path],
    AS_HELP_STRING([--with-web-apache-path=PATH], [Include folder apache2 (default /etc/apache2/conf.d]),
    web_apache_path=$withval,
    web_apache_path=ACICINGA_PATH_GUESS([/etc/httpd/conf.d /etc/apache2/conf.d /etc/apache/conf.d], [web_apache_path], [/etc/apache2/conf.d])
)

AC_ARG_WITH([bin_user],
    AS_HELP_STRING([--with-bin-user=USER], [user for all other files (default root)]),
    bin_user=$withval,
    bin_user=root
)

AC_ARG_WITH([bin_group],
    AS_HELP_STRING([--with-bin-group=GROUP], [group for all other files (default bin)]),
    bin_group=$withval,
    bin_group=bin
)


# Configuration location
AC_ARG_WITH([conf_dir],
    AS_HELP_STRING([--with-conf-dir=PATH], [Folder where to store custom user configurations (default etc/conf.d/)]),
    web_conf_dir=$withval,
    web_conf_dir=$prefix/etc/conf.d   
)

# Log location
AC_ARG_WITH([log_dir],
    AS_HELP_STRING([--with-log-dir=PATH], [Folder where to store log files (default log/)]),
    web_log_dir=$withval,
    web_log_dir=$prefix/log 
)

# Agavi caching directory
AC_ARG_WITH([cache_dir],
    AS_HELP_STRING([--with-cache-dir=PATH], [Directory to store agavi cache files (default app/cache/)]),
    web_cache_dir=$withval,
    web_cache_dir=$prefix/app/cache
)

# Log location
AC_ARG_WITH([schema_prefix],
    AS_HELP_STRING([--with-schma-prefix=Prefix], [Prefix used in your LConf enviromnent]),
    SCHEMA_PREFIX=$withval,
    SCHEMA_PREFIX=lconf
)



# Custom vars
INSTALL_OPTS="-o $bin_user -g $bin_group"
INSTALL_OPTS_WEB="-o $web_user -g $web_group"
INSTALL_OPTS_CACHE="-o $web_user -g $web_group"

flag_caching=true
flag_debug=false

CFLAGS=""

ACICINGA_DEVEL_MODE()

# Substitutions
AC_SUBST(app_name)
AC_SUBST(web_user)
AC_SUBST(web_group)
AC_SUBST(web_path)
AC_SUBST(web_absolute_path)
AC_SUBST(web_apache_path)
AC_SUBST(bin_user)
AC_SUBST(bin_group)
AC_SUBST(CFLAGS)
AC_SUBST(PHP)
AC_SUBST(SQLITE)
AC_SUBST(PHING)
AC_SUBST(PHPUNIT)
AC_SUBST(PHPCS)
AC_SUBST(INSTALL_OPTS)
AC_SUBST(INSTALL_OPTS_WEB)
AC_SUBST(INSTALL_OPTS_CACHE)
AC_SUBST(flag_caching)
AC_SUBST(flag_debug)

AC_SUBST(web_log_dir)
AC_SUBST(web_conf_dir)
AC_SUBST(web_cache_dir)
AC_SUBST(SCHEMA_PREFIX)

AC_CONFIG_FILES([
    Makefile
    lib/Makefile
    lib/icingaScheduler/config.php
    pub/Makefile
    etc/Makefile
    bin/Makefile
    doc/Makefile
    app/Makefile
    app/config.php
    app/config/databases.xml
    app/config/icinga.xml
    app/config/logging.xml
    app/config/settings.xml
    app/config/translation.xml
    app/config/factories.xml
    app/modules/Api/config/access.xml
    app/modules/Api/config/module.xml
    app/modules/AppKit/config/module.xml
    app/modules/AppKit/config/auth.xml
    app/modules/LConf/config/module.xml
    app/modules/LConf/lib/ldapConfig/objectDefaultAttributes.ini
    app/modules/LConf/lib/ldapConfig/staticObjects.ini 
    etc/build.properties
    etc/apache2/lconf-web.conf
    bin/clearcache.sh
    pub/.htaccess
    etc/conf.d/access.xml
    etc/conf.d/databases.xml
    etc/conf.d/Makefile 
])

AC_OUTPUT


echo ""
echo "lconf-web successfully configured!"
echo ""
echo "Please proceed with make to install your icinga-web instance:"
echo ""
echo " * make               Some general hints about make targets"
echo " * make install       Install a new instance of icinga-web"
echo " * make upgrade       Upgrades an existing installation:"
echo "                      keep site config files untouched!"
echo ""

# [EOF]
