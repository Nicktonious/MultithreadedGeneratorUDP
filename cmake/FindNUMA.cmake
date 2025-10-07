find_path(NUMA_INCLUDE_DIR
    NAMES numa.h
    # NO_DEFAULT_PATH PATHS /usr/include
    # PATH_SUFFIXES x86_64-linux-gnu numa
)

find_library(NUMA_LIBRARY
    NAMES libnuma.a
    # NO_DEFAULT_PATH PATHS /usr/lib/
    PATH_SUFFIXES x86_64-linux-gnu
)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(NUMA REQUIRED_VARS NUMA_LIBRARY NUMA_INCLUDE_DIR)

# message("-- | numa: " "<${NUMA_FOUND}> ${NUMA_LIBRARY} / ${NUMA_INCLUDE_DIR}")

if(NUMA_FOUND AND NOT TARGET NUMA::NUMA)
    add_library(NUMA::NUMA UNKNOWN IMPORTED)
    set_property(TARGET NUMA::NUMA PROPERTY IMPORTED_LOCATION "${NUMA_LIBRARY}")
endif()

# mark_as_advanced(NUMA_INCLUDE_DIR NUMA_LIBRARY)
