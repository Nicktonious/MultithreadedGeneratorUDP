let ocaml () =
  touch ".ocamlinit"
    ~c:"#use \"topfind\";;
#require \"unix\";;
(* #require \"ppx_string\";; *)
"
    ();

  let ic = Unix.open_process_in "ocamlformat --version" in
  let version = input_line ic in
  Unix.close_process_in ic |> ignore;

  touch ".ocamlformat"
    ~c:
      ("version=" ^ version
     ^ "
profile=default
margin=80
line-endings=lf
break-cases=all
wrap-comments=true
break-string-literals=never
# break-infix-before-func = false
# break-infix = fit-or-vertical
# break-separators = after
# let-and = sparse
"
      )
    ()

let dune () =
  touch "legas/dune"
    ~c:"(library
  (name legas)
  (modules dummy)
  (libraries ppx_string))
" ();
  let lang = "(lang dune           3.20)\n" in
  let name = "(name                " ^ app ^ ")\n" in
  let opam = "(generate_opam_files true)\n" in
  let authors = "(authors             \"" ^ author ^ " <" ^ email ^ ">\")\n" in
  let maintr = "(maintainers         \"" ^ author ^ " <" ^ email ^ ">\")\n" in
  let bugs = "(bug_reports         \"" ^ email ^ "\")\n" in
  let home = "(homepage            \"" ^ github ^ "\")\n" in
  let lic = "(license             \"" ^ license ^ "\")\n" in
  let src = "(source              (github ponyatov/" ^ app ^ "))\n" in
  let pack = "(package\n" in
  let syno = " (synopsis            \"" ^ title ^ "\")\n" in
  let about = "(description \"" ^ about ^ "\")\n" in
  let empty = "(allow_empty)\n" in
  touch "dune-project"
    ~c:
      (lang ^ name ^ opam ^ authors ^ maintr ^ bugs ^ home ^ lic ^ src ^ pack
     ^ " " ^ name ^ syno ^ about ^ empty ^ ")\n")
    ();
  Sys.command "dune build"
