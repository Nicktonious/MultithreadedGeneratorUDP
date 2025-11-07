.PHONY : install update ref gz
install: $(WS)_install doc ref gz
	$(MAKE) update
	$(MAKE) pcpp
update : $(WS)_update
ref    : $(RF)
gz     : $(GZ)

Debian_install:
Debian_update: apt.$(WS)
	sudo apt update
	sudo apt install -uy `cat apt.$(WS)` $(APT)

Ubuntu_install:
Ubuntu_update: apt.$(WS)
	sudo apt update
	sudo apt install -uy `cat apt.$(WS)` $(APT)
