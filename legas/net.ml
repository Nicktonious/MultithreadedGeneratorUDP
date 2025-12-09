let pcpp () =
  if not (Sys.file_exists "ref/pcpp/README.md") then
    Sys.command
      ("git clone -o orig -b v25.05 --depth 1 https://github.com/seladb/PcapPlusPlus.git ref/pcpp")
    = 0
  else true;;

let netmk () =
  touch "mk/net.mk" ~c:".PHONY: shark
shark:
\tssh dev01@10.120.100.51 dumpcap -i enp1s0np1 -f ip -w - | wireshark -k -i -
#\tssh dev01@10.120.100.51 tshark -i enp1s0np1

.PHONY: recv
recv:
\tssh dev01@10.120.100.51 node reciever/server_cluster.js -d

PCPP_CFG += -DPCAPPP_BUILD_EXAMPLES=OFF
PCPP_CFG += -DPCAPPP_BUILD_TESTS=OFF
PCPP_CFG += -DPCAPPP_BUILD_TUTORIALS=OFF
PCPP_CFG += -DBUILD_SHARED_LIBS=OFF

PCPP_CFG += -DPCAPPP_USE_DPDK=ON
PCPP_CFG += -DPCAPPP_USE_XDP=OFF
PCPP_CFG += -DPCAPPP_BUILD_PCAPPP=ON

PCPP_CFG += -DCMAKE_C_FLAGS=\"-march=native\"
PCPP_CFG += -DCMAKE_CXX_FLAGS=\"-march=native\"

.PHONY: pcpp
pcpp: ref/pcpp/README.md lib/pcpp/setup_dpdk.py
RF += ref/pcpp/README.md lib/pcpp/setup_dpdk.py
# rm -rf lib/pcpp tmp/pcpp ; time make pcpp
lib/pcpp/setup_dpdk.py: tmp/pcpp/setup_dpdk.py
\tsed '1s/python/python3/' $< > $@ ; chmod +x $@
tmp/pcpp/setup_dpdk.py: lib/pcpp/lib/libPacket++.a
lib/pcpp/lib/libPacket++.a: ref/pcpp/README.md
\tcmake $(PCPP_CFG) -S $(dir $<) -B tmp/pcpp --install-prefix=$(LIB)/pcpp
\tcmake --build   tmp/pcpp -j
\tcmake --install tmp/pcpp
ref/pcpp/README.md:
\t$(GITREF) -b $(PCPP_VER) https://github.com/seladb/PcapPlusPlus.git $(dir $@)
"
  ();;

let net () =
  pcpp();netmk();
