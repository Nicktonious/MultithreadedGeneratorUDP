cmake_minimum_required(VERSION 3.25)
get_filename_component(CMAKE_PROJECT_NAME ${CMAKE_SOURCE_DIR} NAME_WE)
project(${CMAKE_PROJECT_NAME} VERSION 0.0.1 LANGUAGES C CXX ASM)

include(version)  # binary files naming by version & git branch/hash
include(src)      # scan project for source code files
include(net)      # raw packets networking

message("-- |")
message("-- | toolchain: " ${CMAKE_CXX_COMPILER} " @ " ${CMAKE_TOOLCHAIN_FILE})
message("-- |      host: " ${CMAKE_HOST_SYSTEM_NAME}-${CMAKE_HOST_SYSTEM_VERSION})
message("-- |    target: " "hw:" ${HW} " cpu:" ${CPU} " arch:" ${ARCH} " os:" ${OS})
message("-- |   startup: " "${S}")
message("-- |    linker: " "${LD}")
message("-- |    binary: " "${CMAKE_INSTALL_PREFIX}/${BIN_OUTPUT_NAME}${CMAKE_EXECUTABLE_SUFFIX}")
message("-- |      data: " "${DATA} ${WASM}")
message("-- |       ini: " "${INI}")
message("-- |")

include(json2cpp)
include(gen2obj)

add_executable(${CMAKE_PROJECT_NAME}
    ${C}  ${H}          # C/C++ source
    ${S}  ${LD}         # embedded/lowlevel
    ${CP} ${HP}         # parsers
    ${DATA} ${WASM}     # precompiled binary data (bytecode,..)
    ${INI}              # init/config files & scripts
)

set_source_files_properties(${INI} PROPERTIES HEADER_FILE_ONLY TRUE)

target_link_libraries(${CMAKE_PROJECT_NAME}
    -Wl,--start-group ${L} -Wl,--end-group
) # -static

include(install) # target install
