#
# spec file for package lconf-web
#
# (c) 2014 Netways GmbH
#
# This file and all modifications and additions to the pristine
# package are under the same license as the package itself.
#

%define revision 1

%define phpname php

# el5 requires newer php53 rather than php (5.1)
%if 0%{?el5} || 0%{?rhel} == 5 || "%{?dist}" == ".el5"
%define phpname php53
%endif

%define phpbuildname %{phpname}

%if "%{_vendor}" == "suse"
%define phpbuildname php5
%endif

%if "%{_vendor}" == "suse"
%define apacheconfdir  %{_sysconfdir}/apache2/conf.d
%define apacheuser wwwrun
%define apachegroup www
%endif
%if "%{_vendor}" == "redhat"
%define apacheconfdir %{_sysconfdir}/httpd/conf.d
%define apacheuser apache
%define apachegroup apache
%endif

%define         lconfwebdir /usr/share/lconf-web
%define         clearcache %{lconfwebdir}/bin/clearcache.sh
%define         docdir %{_defaultdocdir}
%define         ldapprefix lconf

Name:           lconf-web
Summary:        Standalone Web Module for LConf
Version:        1.5.0
Release:        1%{?dist}%{?custom}
Url:            https://www.netways.org/projects/lconf-web
License:        GPL v2 or later
Group:          Applications/System
BuildArch:      noarch

%if "%{_vendor}" == "suse"
%if 0%{?suse_version} > 1020
BuildRequires:  fdupes
%endif
%endif

%if "%{_vendor}" == "suse"
AutoReqProv:    Off
%endif

Source0:        %{name}-%{version}.tar.gz

BuildRoot:      %{_tmppath}/%{name}-%{version}-build

#Requires:       LConf >= 1.4.2
BuildRequires:  %{phpname} >= 5.2.3
BuildRequires:  %{phpname}-devel >= 5.2.3
BuildRequires:  %{phpname}-gd
BuildRequires:  %{phpname}-ldap
BuildRequires:  %{phpname}-pdo

%if "%{_vendor}" == "redhat"
BuildRequires:  %{phpname}-xml
BuildRequires:  php-pear
%endif
%if "%{_vendor}" == "suse"
BuildRequires:  %{phpname}-json
BuildRequires:  %{phpname}-sockets
BuildRequires:  %{phpname}-xsl
BuildRequires:  %{phpname}-dom
BuildRequires:  %{phpname}-pear
%endif

Requires:       pcre >= 7.6
Requires:       %{phpname} >= 5.2.3
Requires:       %{phpname}-gd
Requires:       %{phpname}-ldap
Requires:       %{phpname}-pdo
%if "%{_vendor}" == "redhat"
Requires:       %{phpname}-common
Requires:       %{phpname}-xml
Requires:       php-pear
%endif
%if "%{_vendor}" == "suse"
Requires:       %{phpname}-pear
Requires:       %{phpname}-xsl
Requires:       %{phpname}-dom
Requires:       %{phpname}-tokenizer
Requires:       %{phpname}-gettext
Requires:       %{phpname}-ctype
Requires:       %{phpname}-json
Requires:       %{phpname}-pear
Requires:       mod_php_any
%endif


%description
LConf is a LDAP based configuration tool for Icinga® and Nagios®. All
configuration elements are stored on a LDAP server and exported to text-based
configuration files. Icinga® / Nagios® uses only these config files and will
work independent from the LDAP during runtime.

This is the Standalone Web package which does not require Icinga Web 1.x.

%prep
#%setup -q -n lconf-icinga-module
%setup -q -n lconf-web-%{version}

%build
%configure \
	--prefix="%{_datadir}/%{name}" \
    	--datadir="%{_datadir}/%{name}" \
    	--datarootdir="%{_datadir}/%{name}" \
    	--sysconfdir="%{_sysconfdir}/%{name}" \
	--localstatedir="%{_localstatedir}/%{name}" \
        --with-icinga-web-path="%{icingawebdir}" \
        --with-ldap-prefix="%{ldapprefix}" \
	--with-web-apache-path="%{_sysconfdir}/httpd/conf.d" \
	--with-web-path="/lconf" \
	--with-web-user="%{apacheuser}" \
	--with-web-group="%{apachegroup}"

%install
%{__rm} -rf %{buildroot}
# install will clear the cache, which we will do in post
%{__make} install install-apache-config \
    DESTDIR="%{buildroot}" \
    INSTALL_OPTS="" \
    INSTALL_OPTS_WEB="" \
    COMMAND_OPTS="" \
    INIT_OPTS=""

%post
if [ -x %{clearcache} ]; then %{clearcache}; fi

%postun
if [ -x %{clearcache} ]; then %{clearcache}; fi


%clean
%{__rm} -rf %{buildroot}

%files
%defattr(-,root,root,-)
%doc doc/AUTHORS doc/LICENSE doc/install.md
%defattr(-,root,root,-)
%if "%{_vendor}" == "redhat"
%doc doc/README.RHEL
%endif
%if "%{_vendor}" == "suse"
%doc doc/README.SUSE
%endif
%config(noreplace) %{_datadir}/%{name}/app/modules/LConf/config
%config(noreplace) %attr(-,root,root) %{apacheconfdir}/lconf-web.conf
%{_datadir}/%{name}/app/modules/LConf/actions
%{_datadir}/%{name}/


%changelog
