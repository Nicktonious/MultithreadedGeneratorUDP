let gitref = "ref/" ^ tag

let git () =
  if not (Sys.file_exists (Filename.concat gitref "README.md")) then
    Sys.command
      ("git clone -o orig -b " ^ tag ^ " --depth 1 " ^ orig ^ " " ^ gitref)
    = 0
  else true
