RF += ref/PcapPlusPlus/README.md
ref/PcapPlusPlus/README.md:
	$(GITREF) -b v$(PCPP_VER) https://github.com/seladb/PcapPlusPlus.git $(dir $@)

RF += ref/RF62X-SDK/README.md
ref/RF62X-SDK/README.md:
	$(GITREF) https://github.com/RIFTEK-LLC/RF62X-SDK.git $(dir $@)
	cd $(dir $@) ; git submodule update --init --recursive
