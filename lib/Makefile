prefix=/usr/local/lconf-web
exec_prefix=${prefix}
LOGDIR=${prefix}/var
CFGDIR=${prefix}/etc
BINDIR=${exec_prefix}/bin
CGIDIR=${exec_prefix}/sbin
HTMLDIR=${prefix}/share

INSTALL=/usr/bin/install -c
INSTALL_OPTS=-o root -g bin

install: installdirs
	find . -mindepth 1 -type f -not -name "*.in" -and -not -name "Makefile" -exec $(INSTALL) -m 644 $(INSTALL_OPTS) {} $(DESTDIR)$(prefix)/lib/{} \;

installdirs:
	$(INSTALL) -m 755 $(INSTALL_OPTS) -d $(DESTDIR)$(prefix)/lib
	find . -mindepth 1 -type d -exec $(INSTALL) -m 755 $(INSTALL_OPTS) -d $(DESTDIR)$(prefix)/lib/{} \;
	
