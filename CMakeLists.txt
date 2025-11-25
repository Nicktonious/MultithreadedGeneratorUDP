cmake_minimum_required(VERSION 3.22)
get_filename_component(CMAKE_PROJECT_NAME ${CMAKE_SOURCE_DIR} NAME_WE)
project(${CMAKE_PROJECT_NAME} VERSION 0.0.1 LANGUAGES C CXX ASM)

set(APP send)

include(version)    # binary files naming by version & git branch/hash
include(src)        # scan project for source code files
include(syntax)     # parser generators (flex,yacc/bison,ragel,lemon,..)
include(net)        # raw packets networking

include(json2cpp)   # JSON config generator
include(gen2obj)    # JSON config generator

message("-- |")
message("-- | toolchain: " ${CMAKE_CXX_COMPILER} " @ " ${CMAKE_TOOLCHAIN_FILE})
message("-- |      host: " ${CMAKE_HOST_SYSTEM_NAME}-${CMAKE_HOST_SYSTEM_VERSION})
message("-- |    target: " "hw:" ${HW} " cpu:" ${CPU} " arch:" ${ARCH} " os:" ${OS})
message("-- |   startup: " "${S}")
message("-- |    linker: " "${LD}")
message("-- |    binary: " "${CMAKE_INSTALL_PREFIX}/${BIN_OUTPUT_NAME}${CMAKE_EXECUTABLE_SUFFIX}")
message("-- |")
if(PCAP_FOUND)
message("-- | PCAP: ${PCAP_VERSION}")
endif()
if(DPDK_FOUND)
message("-- | DPDK: ${DPDK_VERSION}")
endif()
if(PCPP_FOUND)
message("-- | PCPP: ${PCPP_VERSION}")
endif()
message("-- |")
message("-- | ${JSON}")
message("-- | ${CP}")
# message("-- | ${H}")
message("-- |")

add_executable(${CMAKE_PROJECT_NAME}
    ${C}  ${H}          # C/C++ source
    ${S}  ${LD}         # embedded/lowlevel
    ${CP} ${HP}         # parsers
    ${DATA}             # precompiled binary data
)

target_link_directories(${CMAKE_PROJECT_NAME} PRIVATE lib/pcpp/lib)

target_link_libraries(${CMAKE_PROJECT_NAME}
    -Wl,--start-group ${LIBS} -Wl,--end-group
) # -static

include(install) # target install
include(fw)      # cross compiler binaries: elf/dfu
include(clean)   # project clean-up (remove generated & temp files)
