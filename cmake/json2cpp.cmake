file(GLOB JSON
    RELATIVE ${CMAKE_SOURCE_DIR}
    etc/config.json
)

foreach(JSON_FILE ${JSON})
    string(REGEX REPLACE ".+\/(.+)\.json$" "${CMAKE_BINARY_DIR}/\\1.json.cpp"
        JSON_CPP           ${JSON_FILE})
        list(APPEND C      ${JSON_CPP})
    string(REGEX REPLACE ".+\/(.+)\.json$" "${CMAKE_BINARY_DIR}/\\1.json.hpp"
        JSON_HPP           ${JSON_FILE})
        list(APPEND H      ${JSON_HPP})
    add_custom_command(
        OUTPUT              ${JSON_CPP} ${JSON_HPP}
        DEPENDS             ${CMAKE_SOURCE_DIR}/src/json2cpp.py ${JSON_FILE}
        WORKING_DIRECTORY   ${CMAKE_SOURCE_DIR}
        COMMAND             ${CMAKE_SOURCE_DIR}/src/json2cpp.py
        ARGS                ${JSON_FILE} ${JSON_CPP} ${JSON_HPP}
    )
endforeach()

# list(APPEND H ${JSON})
