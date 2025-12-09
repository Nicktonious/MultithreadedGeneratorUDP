include(FindPackageHandleStandardArgs)

# ~~~
# - Try to find DPDK include dirs and libraries
#
# Find the DPDK includes and client library
# This module defines:
#  DPDK_FOUND, If false, do not try to use DPDK.
#  DPDK_INCLUDE_DIRS, where to find rte_config.h and rte_version.h
#  DPDK_LIBRARIES, the libraries needed by a DPDK user
#  DPDK_CFLAGS_OTHER, the compile flags to use
#  DPDK_VERSION, the version of the library
# ~~~

find_package(PkgConfig QUIET)
pkg_check_modules(DPDK REQUIRED libdpdk>=22.11)
# if(PKG_CONFIG_FOUND)
#   pkg_check_modules(DPDK QUIET IMPORTED_TARGET libdpdk>=22.11)
# endif()

if(DPDK_FOUND)
  add_compile_definitions(DPDK_FOUND)

  add_library(DPDK::DPDK INTERFACE IMPORTED)

  target_include_directories(DPDK::DPDK INTERFACE ${DPDK_INCLUDE_DIRS})
  target_compile_options(DPDK::DPDK INTERFACE ${DPDK_CFLAGS_OTHER})
  target_link_libraries(DPDK::DPDK INTERFACE ${DPDK_LIBRARIES})

#   set(DPDK_DEBUG TRUE)
  if(DPDK_DEBUG)
    message("-----------")
    message("Libraries: ${DPDK_LIBRARIES}")
    message("Link Libraries: ${DPDK_LINK_LIBRARIES}")
    message("Library DIr: ${DPDK_LIBRARY_DIRS}")
    message("Ldflags: ${DPDK_LDFLAGS}")
    message("Include Dirs: ${DPDK_INCLUDE_DIRS}")
    message("Cflags: ${DPDK_CFLAGS}")
    message("Cflags Other: ${DPDK_CFLAGS_OTHER}")
    message("Version: ${DPDK_VERSION}")
    message("-----------")
  endif()
    list(APPEND INC ${DPDK_INCLUDE_DIRS})
    list(APPEND L ${DPDK_LINK_LIBRARIES})
    add_compile_options(${DPDK_CFLAGS} ${DPDK_CFLAGS_OTHER})
    add_compile_definitions()
    add_link_options(${DPDK_LDFLAGS})
endif()
