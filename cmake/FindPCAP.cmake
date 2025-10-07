find_path(PCAP_INCLUDE_DIR
    NAMES pcap.h
    # NO_DEFAULT_PATH PATHS /usr/include
    # PATH_SUFFIXES x86_64-linux-gnu pcap
)

find_library(PCAP_LIBRARY
    NAMES libpcap.a
    # NO_DEFAULT_PATH PATHS /usr/lib/
    PATH_SUFFIXES x86_64-linux-gnu
)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(PCAP REQUIRED_VARS PCAP_LIBRARY PCAP_INCLUDE_DIR)

# message("-- | pcap: " "<${PCAP_FOUND}> ${PCAP_LIBRARY} / ${PCAP_INCLUDE_DIR}")

if(PCAP_FOUND AND NOT TARGET PCAP::PCAP)
    add_library(PCAP::PCAP UNKNOWN IMPORTED)
    set_property(TARGET PCAP::PCAP PROPERTY IMPORTED_LOCATION "${PCAP_LIBRARY}")
endif()

# mark_as_advanced(PCAP_INCLUDE_DIR PCAP_LIBRARY)
