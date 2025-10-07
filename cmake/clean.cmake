# project clean-up (remove generated & temp files)

file(GLOB BINS
    ${CMAKE_INSTALL_PREFIX}/${CMAKE_PROJECT_NAME}*
        ${CMAKE_BINARY_DIR}/${CMAKE_PROJECT_NAME}*)

set_property (
    TARGET ${CMAKE_PROJECT_NAME}
    APPEND PROPERTY ADDITIONAL_CLEAN_FILES ${BINS} ${ELF} ${DFU})
