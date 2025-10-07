# scan project for source code files

# file(GLOB LD -> cmake/any_toolchain.cmake

file(GLOB S
    RELATIVE ${CMAKE_SOURCE_DIR}
    hw/${HW}/*.s
)

file(GLOB C
    RELATIVE ${CMAKE_SOURCE_DIR}
    src/*.c*
)

file(GLOB H
    RELATIVE ${CMAKE_SOURCE_DIR}
    inc/*.h*
    # net
    ${PCAP_INCLUDE_DIR}/pcap.h* ${PCAP_INCLUDE_DIR}/pcap/*.h*
    ${NUMA_INCLUDE_DIR}/*.h*
    ${DPDK_INCLUDE_DIR}/*.h*
    ${PCPP_INCLUDE_DIR}/*.h*
)

file(GLOB INC
    RELATIVE ${CMAKE_SOURCE_DIR}
    ${CMAKE_BINARY_DIR}
    inc
    # net
    ${PCAP_INCLUDE_DIR} ${PCAP_INCLUDE_DIR}/pcap
    ${NUMA_INCLUDE_DIR}
    ${DPDK_INCLUDE_DIR}
    ${PCPP_INCLUDE_DIR}
)
include_directories(${INC})

file(GLOB A
    # net
    ${PCAP_LIBRARY}
    ${NUMA_LIBRARY}
    ${DPDK_LIBRARY}
    ${PCPP_LIBRARY}
)

if(${NET_} STREQUAL PCAP)
set(A ${A} -ldbus-1 -libverbs)
endif()

# SEARCH(NUMA REQUIRED)
