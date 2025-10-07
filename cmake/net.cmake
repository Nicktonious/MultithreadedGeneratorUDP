# raw packets networking

if(${NET_} STREQUAL DPDK)
find_package(NUMA REQUIRED)
find_package(DPDK REQUIRED)
endif()

if(${NET_} STREQUAL PCAP)
find_package(PCAP REQUIRED)
endif()

find_package(PCPP REQUIRED)

# also see ${A} @ cmake/src.cmake
