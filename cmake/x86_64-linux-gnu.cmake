set(CMAKE_SYSTEM_NAME       Linux)
set(CMAKE_SYSTEM_PROCESSOR  x86_64)
set(TOOLCHAIN_PREFIX        ${ARCH}-${OS}-gnu)
set(CMAKE_EXECUTABLE_SUFFIX "")

include(any_toolchain)

add_compile_definitions(X86_64 LINUX)
add_compile_options(-mtune=native)
add_link_options()
