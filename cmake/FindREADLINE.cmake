include(FindPackageHandleStandardArgs)

# find_package(PkgConfig QUIET)
# if(PKG_CONFIG_FOUND)
#     pkg_check_modules(READLINE QUIET IMPORTED_TARGET readline>=8.2)
# endif()

# if(READLINE_FOUND)
#     message("-- Found READLINE: with pkg-config (found version ${READLINE_VERSION})")
#     include_directories(${READLINE_INCLUDE_DIR})
#     list(APPEND LIBS ${READLINE_LINK_LIBRARIES})

# else()
#     message(FATAL_ERROR "-- READLINE library not found")
# endif()

find_library(READLINE_LIBRARY
    NAMES readline
    HINTS ${READLINE_ROOT} /usr/local/lib/* /usr/lib/*
    PATH_SUFFIXES lib
)

find_path(READLINE_INCLUDE_DIR
    NAMES readline.h history.h
    HINTS ${READLINE_ROOT} /usr/local/include /usr/include
    PATH_SUFFIXES readline
)

find_package_handle_standard_args(READLINE DEFAULT_MSG
    READLINE_LIBRARY
    READLINE_INCLUDE_DIR
)

if(READLINE_FOUND)
    list(APPEND LIBS ${READLINE_LIBRARY})
endif()

# if(READLINE_FOUND AND NOT TARGET READLINE::READLINE)
#     add_library(READLINE::READLINE SHARED IMPORTED)
#     set_target_properties(READLINE::READLINE PROPERTIES
#         IMPORTED_LOCATION "${READLINE_LIBRARY}"
#         INTERFACE_INCLUDE_DIRECTORIES "${READLINE_INCLUDE_DIR}"
#     )
# endif()
