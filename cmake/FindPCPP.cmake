include(FindPackageHandleStandardArgs)

# ~~~
# - Try to find PCPP include dirs and libraries
#
# Find the PCPP includes and client library
# This module defines:
#  PCPP_FOUND, If false, do not try to use PCPP.
#  PCPP_INCLUDE_DIRS, where to find rte_config.h and rte_version.h
#  PCPP_LIBRARIES, the libraries needed by a PCPP user
#  PCPP_CFLAGS_OTHER, the compile flags to use
#  PCPP_VERSION, the version of the library
# ~~~

set(ENV{PKG_CONFIG_PATH} "$ENV{PKG_CONFIG_PATH}:${CMAKE_SOURCE_DIR}/lib/pcpp/lib/pkgconfig")

find_package(PkgConfig QUIET)
if(PKG_CONFIG_FOUND)
  pkg_check_modules(PCPP QUIET IMPORTED_TARGET PcapPlusPlus=25.05)
endif()

if(PCPP_FOUND)
  message("-- Found PCPP: with pkg-config (found version ${PCPP_VERSION})")
  if(PCPP_DEBUG)
    message("-----------")
    message("Libraries: ${PCPP_LIBRARIES}")
    message("Link Libraries: ${PCPP_LINK_LIBRARIES}")
    message("Library DIr: ${PCPP_LIBRARY_DIRS}")
    message("Ldflags: ${PCPP_LDFLAGS}")
    message("Include Dirs: ${PCPP_INCLUDE_DIRS}")
    message("Cflags: ${PCPP_CFLAGS}")
    message("Cflags Other: ${PCPP_CFLAGS_OTHER}")
    message("Version: ${PCPP_VERSION}")
    message("-----------")
  endif()
    list(APPEND LIBS ${PCPP_LINK_LIBRARIES})
endif()
