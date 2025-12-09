open Unix

let touch name ?(c = "") () =
  (* if not (Sys.file_exists name) then *)
  let f = open_out name in
  output_string f c;
  close_out f

let mkd name ?(c = "!.gitignore\n") () =
  if not (Sys.file_exists name) then Sys.mkdir name 0o755;
  touch (Filename.concat name ".gitignore") ~c ()

let dirs () =
  [ ".vscode"; "lib"; "inc"; "src" ] |> List.iter (fun d -> mkd d ())

let bins () =
  [ "bin"; "tmp"; "ref" ] |> List.iter (fun d -> mkd d ~c:"*\n!.gitignore\n" ())

let giti () =
  touch ".gitignore" ~c:"*~
*.swp
*.log
/_build/
/target/
!.gitignore
" ()

let apt () =
  touch "apt.Debian"
    ~c:
      "git make curl fzf
code meld doxygen
g++ cmake pkg-config clang-format
gdb gdbserver valgrind
flex bison ragel libreadline-dev
"
    ()
  touch "apt.Ubuntu"
    ~c:
      "git make curl fzf
doxygen
g++ cmake pkg-config clang-format
gdb gdbserver valgrind
flex bison ragel libreadline-dev
"
    ()

let readme () =
  (* *)
  touch "README.md"
    ~c:
      ("# `" ^ app ^ "` " ^ tag ^ "\n## " ^ title ^ "\n\n(c) " ^ author ^ " <<"
     ^ email ^ ">> " ^ Int.to_string year ^ " " ^ license ^ "\n\n" ^ github
     ^ "\n" ^ about)
    ()
