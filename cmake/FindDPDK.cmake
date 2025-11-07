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

# Try to find DPDK with pkg-config first!
find_package(PkgConfig QUIET)
if(PKG_CONFIG_FOUND)
  pkg_check_modules(DPDK QUIET IMPORTED_TARGET libdpdk>=22.11)
endif()

# We found using Pkg-Config!
if(DPDK_FOUND)
  message("-- Found DPDK: with pkg-config (found version ${DPDK_VERSION})")
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
    list(APPEND LIBS ${DPDK_LINK_LIBRARIES})
endif()
