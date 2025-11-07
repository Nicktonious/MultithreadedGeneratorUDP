include(FindPackageHandleStandardArgs)

# ~~~
# - Try to find PCAP include dirs and libraries
#
# Find the PCAP includes and client library
# This module defines:
#  PCAP_FOUND, If false, do not try to use PCAP.
#  PCAP_INCLUDE_DIRS, where to find rte_config.h and rte_version.h
#  PCAP_LIBRARIES, the libraries needed by a PCAP user
#  PCAP_CFLAGS_OTHER, the compile flags to use
#  PCAP_VERSION, the version of the library
# ~~~

find_package(PkgConfig QUIET)
if(PKG_CONFIG_FOUND)
  pkg_check_modules(PCAP QUIET IMPORTED_TARGET libpcap>=1.10.3)
endif()

if(PCAP_FOUND)
  message("-- Found PCAP: with pkg-config (found version ${PCAP_VERSION})")
  if(PCAP_DEBUG)
    message("-----------")
    message("Libraries: ${PCAP_LIBRARIES}")
    message("Link Libraries: ${PCAP_LINK_LIBRARIES}")
    message("Library DIr: ${PCAP_LIBRARY_DIRS}")
    message("Ldflags: ${PCAP_LDFLAGS}")
    message("Include Dirs: ${PCAP_INCLUDE_DIRS}")
    message("Cflags: ${PCAP_CFLAGS}")
    message("Cflags Other: ${PCAP_CFLAGS_OTHER}")
    message("Version: ${PCAP_VERSION}")
    message("-----------")
  endif()
endif()
