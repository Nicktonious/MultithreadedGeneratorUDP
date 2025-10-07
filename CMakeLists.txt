cmake_minimum_required(VERSION 3.22)
get_filename_component(CMAKE_PROJECT_NAME ${CMAKE_SOURCE_DIR} NAME_WE)
project(${CMAKE_PROJECT_NAME} VERSION 0.0.1 LANGUAGES C CXX ASM)

include(version)        # binary files naming by version & git branch/hash
include(net)            # raw packets networking (PCAP/DPDK)
include(src)            # scan project for source code files
include(syntax)         # parser generators (flex,yacc/bison,ragel,lemon,..)

message("-- |")
message("-- | toolchain: " ${CMAKE_CXX_COMPILER} " @ " ${CMAKE_TOOLCHAIN_FILE})
message("-- |      host: " ${CMAKE_HOST_SYSTEM_NAME} "/" ${CMAKE_HOST_SYSTEM_VERSION})
message("-- |    target: " "hw:" ${HW} " cpu:" ${CPU} " arch:" ${ARCH} " os:" ${OS} " net:" ${NET})
if(${S})
message("-- |   startup: " "${S}")
endif()
if(${LD})
message("-- |    linker: " "${LD}")
endif()
message("-- |    binary: " ${CMAKE_INSTALL_PREFIX}/${BIN_OUTPUT_NAME}${CMAKE_EXECUTABLE_SUFFIX})
message("-- |")
if(${NET_} STREQUAL PCAP)
message("-- | pcap: " "${PCAP_LIBRARY} @ ${PCAP_INCLUDE_DIR}")
endif()
if(${NET_} STREQUAL DPDK)
message("-- | numa: " "${NUMA_LIBRARY} @ ${NUMA_INCLUDE_DIR}")
message("-- | dpdk: " "${DPDK_LIBRARY} @ ${DPDK_INCLUDE_DIR}")
endif()
message("-- | pcpp: " "${PCPP_LIBRARY} @ ${PCPP_INCLUDE_DIR}")
message("-- |")

add_executable(${CMAKE_PROJECT_NAME}
    ${C}  ${H}          # C/C++ source
    ${S}  ${LD}         # embedded/lowlevel
    ${CP} ${HP}         # parsers
    )
    
# target_link_directories(${CMAKE_PROJECT_NAME} PRIVATE lib/pcpp/lib)

# target_include_directories(${CMAKE_PROJECT_NAME} PRIVATE ${PCPP_INCLUDE_DIR})

target_link_libraries(${CMAKE_PROJECT_NAME}
    -Wl,--start-group ${A} -Wl,--end-group
) # -static    

# target_link_libraries(${CMAKE_PROJECT_NAME} PRIVATE )

include(install)        # target install
# include(clean)          # project clean-up (remove generated & temp files)
