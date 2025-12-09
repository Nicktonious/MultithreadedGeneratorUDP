let touch name ?(c = "") () =
  (* if not (Sys.file_exists name) then *)
  let f = open_out name in
  output_string f c;
  close_out f

let mkd name ?(c = "!.gitignore\n") () =
  if not (Sys.file_exists name) then Sys.mkdir name 0o755;
  touch (Filename.concat name ".gitignore") ~c:c ()

open Unix

let extensions () =
  touch ".vscode/extensions.json" ~c:"{
    \"recommendations\": [
        \"stkb.rewrap\",
        \"ms-vscode.makefile-tools\",
        \"IBM.output-colorizer\",
        \"usernamehw.errorlens\",
        // formatters
        \"xaver.clang-format\",
        \"esbenp.prettier-vscode\",
        \"foxundermoon.shell-format\",
        // Linux
        \"ms-vscode-remote.remote-ssh\",
        \"coolbear.systemd-unit-file\",
        // C++
        \"ms-vscode.cpptools\",
        \"jeff-hykin.better-cpp-syntax\",
        \"ms-vscode.cmake-tools\",
        \"krosf.vscode-valgrind\",
        // parser
        \"daohong-emilio.yash\",
        \"rreverser.ragel\",
        // Python
        \"ms-python.python\",
        \"ms-python.autopep8\",
        \"charliermarsh.ruff\",
        // OCaml
        \"ocamllabs.ocaml-platform\",
    ]
}
" ()

let vscode () = 
  mkd ".vscode";
  touch ".vscode/.gitignore" ~c:"!.gitignore";
  touch ".vscode/extensions.json" ();
  touch ".vscode/launch.json" ();
  touch ".vscode/settings.json" ();
  touch ".vscode/.gitignore" ();
  touch ".vscode/c_cpp_properties.json" ();
  touch ".vscode/tasks.json" ();
