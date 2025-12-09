.PHONY: shark
shark:
	ssh dev01@10.120.100.51 dumpcap -i enp1s0np1 -f ip -w - | wireshark -k -i -
#	ssh dev01@10.120.100.51 tshark -i enp1s0np1

.PHONY: recv
recv:
	ssh dev01@10.120.100.51 node reciever/server_cluster.js -d

PCPP_CFG += -DPCAPPP_BUILD_EXAMPLES=OFF
PCPP_CFG += -DPCAPPP_BUILD_TESTS=OFF
PCPP_CFG += -DPCAPPP_BUILD_TUTORIALS=OFF
PCPP_CFG += -DBUILD_SHARED_LIBS=OFF

PCPP_CFG += -DPCAPPP_USE_DPDK=ON
PCPP_CFG += -DPCAPPP_USE_XDP=OFF
PCPP_CFG += -DPCAPPP_BUILD_PCAPPP=ON

PCPP_CFG += -DCMAKE_C_FLAGS="-march=native"
PCPP_CFG += -DCMAKE_CXX_FLAGS="-march=native"

.PHONY: pcpp
pcpp: ref/pcpp/README.md lib/pcpp/setup_dpdk.py
RF += ref/pcpp/README.md lib/pcpp/setup_dpdk.py
# rm -rf lib/pcpp tmp/pcpp ; time make pcpp
lib/pcpp/setup_dpdk.py: tmp/pcpp/setup_dpdk.py
	sed '1s/python/python3/' $< > $@ ; chmod +x $@
tmp/pcpp/setup_dpdk.py: lib/pcpp/lib/libPacket++.a
lib/pcpp/lib/libPacket++.a: ref/pcpp/README.md
	cmake $(PCPP_CFG) -S $(dir $<) -B tmp/pcpp --install-prefix=$(LIB)/pcpp
	cmake --build   tmp/pcpp -j
	cmake --install tmp/pcpp
ref/pcpp/README.md:
	$(GITREF) -b $(PCPP_VER) https://github.com/seladb/PcapPlusPlus.git $(dir $@)
