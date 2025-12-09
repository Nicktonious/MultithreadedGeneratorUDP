file(GLOB GEN
    RELATIVE ${CMAKE_SOURCE_DIR}
    # data/**/*.gen
    temp/**/*.gen
)

# message("-- | gen: ${GEN}")

foreach(GEN_FILE ${GEN})
    string(REGEX REPLACE ".+\/(.+)\.gen$" "${CMAKE_BINARY_DIR}/\\1.gen.o"
        DATA_FILE           ${GEN_FILE})
        list(APPEND DATA    ${DATA_FILE})
    add_custom_command(
        OUTPUT              ${DATA_FILE}
        DEPENDS             ${GEN_FILE}
        WORKING_DIRECTORY   ${CMAKE_SOURCE_DIR}
        COMMAND             objcopy -I binary -O elf64-x86-64 -B i386
        ARGS                ${GEN_FILE} ${DATA_FILE}
    )
endforeach()
