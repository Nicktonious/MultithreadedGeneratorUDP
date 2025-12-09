# include(FindPackageHandleStandardArgs)

# ~~~
# - Try to find ZMQ include dirs and libraries
#
# Find the ZMQ includes and client library
# This module defines:
#  ZMQ_FOUND, If false, do not try to use ZMQ.
#  ZMQ_INCLUDE_DIRS, where to find rte_config.h and rte_version.h
#  ZMQ_LIBRARIES, the libraries needed by a ZMQ user
#  ZMQ_CFLAGS_OTHER, the compile flags to use
#  ZMQ_VERSION, the version of the library
# ~~~

find_package(PkgConfig REQUIRED)
pkg_check_modules(ZMQ REQUIRED cppzmq>=4.10)

if(ZMQ_FOUND)
  add_compile_definitions(ZMQ_FOUND)

  add_library(ZMQ::ZMQ INTERFACE IMPORTED)

  target_include_directories(ZMQ::ZMQ INTERFACE ${ZMQ_INCLUDE_DIRS})
  target_compile_options(ZMQ::ZMQ INTERFACE ${ZMQ_CFLAGS_OTHER})
  target_link_libraries(ZMQ::ZMQ INTERFACE ${ZMQ_LIBRARIES})

#   set(ZMQ_DEBUG TRUE)
  if(ZMQ_DEBUG)
    message("-----------")
    message("Libraries: ${ZMQ_LIBRARIES}")
    message("Link Libraries: ${ZMQ_LINK_LIBRARIES}")
    message("Library DIr: ${ZMQ_LIBRARY_DIRS}")
    message("Ldflags: ${ZMQ_LDFLAGS}")
    message("Include Dirs: ${ZMQ_INCLUDE_DIRS}")
    message("Cflags: ${ZMQ_CFLAGS}")
    message("Cflags Other: ${ZMQ_CFLAGS_OTHER}")
    message("Version: ${ZMQ_VERSION}")
    message("-----------")
  endif()
    list(APPEND INC ${ZMQ_INCLUDE_DIRS})
    list(APPEND L ${ZMQ_LINK_LIBRARIES})

    target_include_directories(ZMQ::ZMQ INTERFACE ${ZMQ_INCLUDE_DIRS})
    target_compile_options    (ZMQ::ZMQ INTERFACE ${ZMQ_CFLAGS_OTHER})
    target_link_libraries     (ZMQ::ZMQ INTERFACE ${ZMQ_LIBRARIES}   )
    target_link_options       (ZMQ::ZMQ INTERFACE ${ZMQ_LDFLAGS}     )

    # add_compile_options(${ZMQ_CFLAGS})
    # add_compile_definitions()
    # add_link_options(${ZMQ_LDFLAGS})
endif()
