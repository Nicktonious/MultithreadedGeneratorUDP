set(CMAKE_C_STANDARD   17)
set(CMAKE_CXX_STANDARD 23)

# set(CMAKE_C_COMPILER_FORCED   TRUE) # breaks Qt
# set(CMAKE_CXX_COMPILER_FORCED TRUE)
set(CMAKE_C_COMPILER_ID       GNU)
set(CMAKE_CXX_COMPILER_ID     GNU)

set(CMAKE_C_COMPILER   ${TOOLCHAIN_PREFIX}-gcc)
set(CMAKE_ASM_COMPILER ${TOOLCHAIN_PREFIX}-as)
set(CMAKE_CXX_COMPILER ${TOOLCHAIN_PREFIX}-g++)
set(CMAKE_LINKER       ${TOOLCHAIN_PREFIX}-ld)
set(CMAKE_OBJCOPY      ${TOOLCHAIN_PREFIX}-objcopy)
set(CMAKE_SIZE         ${TOOLCHAIN_PREFIX}-size)
set(CMAKE_RC_COMPILER  ${TOOLCHAIN_PREFIX}-windres)

set   (APP ${CMAKE_PROJECT_NAME})
string(TOUPPER ${APP} APP_)

# include(cross)

add_compile_options(
    # -Wall -Wextra               # -Wpedantic
    # -Wno-implicit-fallthrough   # ragel
    # -Wno-unused-function        # flex
    # -Wno-write-strings          # yacc
    # -Wno-unused-parameter       # stm32
    $<$<CONFIG:Debug>:-DDEBUG>
)

add_compile_definitions(
    ${APP_} APP="${APP}" ${HW_} ${CPU_} ${ARCH_} ${OS_}
)

add_link_options(
    -Wl,--print-memory-usage
)

if(CMAKE_BUILD_TYPE MATCHES Debug)
    add_compile_options(-O0 -g3)
endif()
if(CMAKE_BUILD_TYPE MATCHES Release)
    add_compile_options(-Os -g0)
endif()

set(CMAKE_EXECUTABLE_SUFFIX_ASM ${CMAKE_EXECUTABLE_SUFFIX})
set(CMAKE_EXECUTABLE_SUFFIX_C   ${CMAKE_EXECUTABLE_SUFFIX})
set(CMAKE_EXECUTABLE_SUFFIX_CXX ${CMAKE_EXECUTABLE_SUFFIX})

file(GLOB LD hw/${HW}/*.ld)
