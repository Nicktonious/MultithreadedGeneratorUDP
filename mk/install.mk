.PHONY : install update ref gz
install: $(WS)_install doc gz ref
	$(MAKE) update
	$(MAKE) pcpp
update : $(WS)_update
ref    : $(REF)
gz     : $(GZ)

.PHONY: headless
headless: doc gz ref
	sudo apt update
	sudo apt install -uy `cat apt.$(WS).headless` $(APT)
	$(MAKE) pcpp

Debian_install:
# sudo dpkg --add-architecture i386
Debian_update:
	sudo apt update
	sudo apt install -uy `cat apt.$(WS)` $(APT)
