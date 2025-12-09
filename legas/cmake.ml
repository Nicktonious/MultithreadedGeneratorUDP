
let cMakeLists () = touch "CMakeLists.txt" ()
let cMakePresets () = touch "CMakePresets.json" ()

let install () =
  touch "cmake/install.cmake" ~c:"set_target_properties(${CMAKE_PROJECT_NAME}
    PROPERTIES OUTPUT_NAME ${BIN_OUTPUT_NAME}${CMAKE_EXECUTABLE_SUFFIX})
install(TARGETS ${CMAKE_PROJECT_NAME}
    DESTINATION ${CMAKE_INSTALL_PREFIX})
file(CREATE_LINK ${BIN_OUTPUT_NAME}${CMAKE_EXECUTABLE_SUFFIX}
    ${CMAKE_INSTALL_PREFIX}/${CMAKE_PROJECT_NAME} SYMBOLIC)
" ()

let src () =
  touch "cmake/src.cmake" ()

let cmake () =
  cMakeLists ();
  cMakePresets ();
  mkd "cmake" ();
  Sys.command "cp ~/em/cmake/x86_64-linux-gnu.cmake cmake/";
  Sys.command "cp ~/em/cmake/any_toolchain.cmake cmake/";
  Sys.command "cp ~/em/cmake/cross.cmake cmake/";
  Sys.command "cp ~/em/cmake/version.cmake cmake/";
  src()
  install ()